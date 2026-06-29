from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import psycopg2.extras
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, IsolationForest
from sklearn.preprocessing import LabelEncoder
import joblib
import os
from dotenv import load_dotenv

load_dotenv()
app = FastAPI(title="LabCommand AI Service")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def get_db():
    return psycopg2.connect(
        host=os.getenv("DB_HOST","localhost"),
        port=os.getenv("DB_PORT","5432"),
        database=os.getenv("DB_NAME","labcommand"),
        user=os.getenv("DB_USER","noushadrafi"),
    )

def get_equipment_data():
    conn = get_db()
    cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT e.id, e.name, e.category, e.status,
               e.usage_hours, e.fault_count,
               COALESCE(EXTRACT(DAY FROM NOW() - e.last_service_date), 365) as days_since_service,
               COUNT(DISTINCT m.id) as maintenance_count,
               COUNT(DISTINCT c.id) as complaint_count,
               l.name as lab_name
        FROM equipment e
        LEFT JOIN maintenance m ON m.equipment_id = e.id AND m.status = 'completed'
        LEFT JOIN complaints c ON c.equipment_id = e.id
        LEFT JOIN labs l ON e.lab_id = l.id
        GROUP BY e.id, e.name, e.category, e.status,
                 e.usage_hours, e.fault_count, e.last_service_date, l.name
    """)
    rows = cur.fetchall()
    cur.close(); conn.close()
    return [dict(r) for r in rows]

le = LabelEncoder()
le.fit(['Computer','Printer','Network','AV','Power','Instrument','Other'])

def prepare_features(items):
    df = pd.DataFrame(items)
    df['usage_hours']        = pd.to_numeric(df.get('usage_hours', 0), errors='coerce').fillna(0)
    df['fault_count']        = pd.to_numeric(df.get('fault_count', 0), errors='coerce').fillna(0)
    df['days_since_service'] = pd.to_numeric(df.get('days_since_service', 180), errors='coerce').fillna(180)
    df['maintenance_count']  = pd.to_numeric(df.get('maintenance_count', 0), errors='coerce').fillna(0)
    df['complaint_count']    = pd.to_numeric(df.get('complaint_count', 0), errors='coerce').fillna(0)
    cats = df['category'].fillna('Other')
    cats = cats.apply(lambda x: x if x in le.classes_ else 'Other')
    df['category_enc'] = le.transform(cats)
    return df[['usage_hours','fault_count','days_since_service','maintenance_count','complaint_count','category_enc']]

FEATURE_NAMES = ['usage_hours','fault_count','days_since_service','maintenance_count','complaint_count','category']

rf_model = None
if_model = None

def train_models():
    global rf_model, if_model
    items = get_equipment_data()
    if not items:
        return False
    X = prepare_features(items)
    y = X['days_since_service'].values
    rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
    rf_model.fit(X, y)
    if_model = IsolationForest(contamination=0.2, random_state=42)
    if_model.fit(X)
    joblib.dump(rf_model, 'rf_model.pkl')
    joblib.dump(if_model, 'if_model.pkl')
    print("Models trained and saved.")
    return True

if os.path.exists('rf_model.pkl'):
    rf_model = joblib.load('rf_model.pkl')
    if_model = joblib.load('if_model.pkl')
    print("Models loaded from disk.")
else:
    print("Training models...")
    train_models()

def get_risk_level(days):
    if days <= 30:  return 'critical'
    if days <= 60:  return 'high'
    if days <= 120: return 'medium'
    return 'low'

@app.get("/")
def health():
    return {
        "status": "ok",
        "service": "LabCommand AI",
        "models": {
            "random_forest": rf_model is not None,
            "isolation_forest": if_model is not None
        }
    }

@app.get("/predict/all")
def predict_all():
    try:
        items = get_equipment_data()
        if not items:
            return {"success": False, "message": "No equipment data"}
        X       = prepare_features(items)
        preds   = rf_model.predict(X) if rf_model else [180]*len(items)
        anomaly = if_model.predict(X) if if_model else [1]*len(items)
        scores  = if_model.score_samples(X) if if_model else [0]*len(items)
        importances = rf_model.feature_importances_.tolist() if rf_model else [0]*6
        fi_dict = dict(zip(FEATURE_NAMES, [round(v,3) for v in importances]))
        results = []
        for i, item in enumerate(items):
            days = max(0, int(round(preds[i])))
            results.append({
                "id":                 item['id'],
                "name":               item['name'],
                "category":           item['category'],
                "lab_name":           item.get('lab_name',''),
                "status":             item['status'],
                "usage_hours":        int(item['usage_hours'] or 0),
                "fault_count":        int(item['fault_count'] or 0),
                "days_since_service": int(item['days_since_service'] or 0),
                "days_until_service": days,
                "risk_level":         get_risk_level(days),
                "is_anomaly":         bool(anomaly[i] == -1),
                "anomaly_score":      round(float(scores[i]), 3),
                "feature_importance": fi_dict,
            })
        results.sort(key=lambda x: x['days_until_service'])
        return {"success": True, "data": results, "feature_importance": fi_dict}
    except Exception as e:
        return {"success": False, "message": str(e)}

@app.post("/train")
def retrain():
    success = train_models()
    return {"success": success, "message": "Models retrained" if success else "No data"}

@app.get("/anomaly/machines")
def anomaly_machines():
    try:
        conn = get_db()
        cur  = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT machine_id,
                   ROUND(AVG(cpu_percent)::numeric,1) as avg_cpu,
                   ROUND(AVG(ram_percent)::numeric,1) as avg_ram,
                   ROUND(AVG(disk_percent)::numeric,1) as avg_disk,
                   COUNT(*)::int as readings
            FROM telemetry_snapshots
            WHERE recorded_at >= NOW() - INTERVAL '1 hour'
            GROUP BY machine_id
            HAVING COUNT(*) >= 2
        """)
        rows = cur.fetchall()
        cur.close(); conn.close()
        if not rows:
            return {"success": True, "data": []}
        df   = pd.DataFrame([dict(r) for r in rows])
        X    = df[['avg_cpu','avg_ram','avg_disk']].fillna(0)
        det  = IsolationForest(contamination=0.2, random_state=42)
        pred = det.fit_predict(X)
        results = []
        for i, row in enumerate(rows):
            results.append({
                "machine_id": row['machine_id'],
                "avg_cpu":    float(row['avg_cpu'] or 0),
                "avg_ram":    float(row['avg_ram'] or 0),
                "avg_disk":   float(row['avg_disk'] or 0),
                "readings":   int(row['readings']),
                "is_anomaly": bool(pred[i] == -1),
            })
        return {"success": True, "data": results}
    except Exception as e:
        return {"success": False, "message": str(e)}