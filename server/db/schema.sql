CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(100) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  role       VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin','staff','invigilator','student')),
  is_active  BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS labs (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  location  VARCHAR(100),
  capacity  INT DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS machines (
  id          SERIAL PRIMARY KEY,
  lab_id      INT REFERENCES labs(id),
  hostname    VARCHAR(100),
  ip_address  VARCHAR(50),
  os_info     VARCHAR(100),
  status      VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online','offline','locked','exam','classroom')),
  last_seen   TIMESTAMP,
  row_pos     INT DEFAULT 0,
  col_pos     INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telemetry_snapshots (
  id           SERIAL PRIMARY KEY,
  machine_id   INT REFERENCES machines(id),
  cpu_percent  FLOAT,
  ram_percent  FLOAT,
  disk_percent FLOAT,
  ram_total_gb FLOAT,
  ram_used_gb  FLOAT,
  net_sent_mb  FLOAT,
  net_recv_mb  FLOAT,
  recorded_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS process_log (
  id           SERIAL PRIMARY KEY,
  machine_id   INT REFERENCES machines(id),
  process_name VARCHAR(200),
  pid          INT,
  cpu_percent  FLOAT,
  mem_mb       FLOAT,
  recorded_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS software_whitelist (
  id           SERIAL PRIMARY KEY,
  lab_id       INT REFERENCES labs(id),
  process_name VARCHAR(200) NOT NULL,
  display_name VARCHAR(200),
  is_allowed   BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS alerts (
  id         SERIAL PRIMARY KEY,
  machine_id INT REFERENCES machines(id),
  lab_id     INT REFERENCES labs(id),
  type       VARCHAR(50),
  severity   VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  title      VARCHAR(200),
  message    TEXT,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  from_user  INT REFERENCES users(id),
  machine_id INT REFERENCES machines(id),
  content    TEXT NOT NULL,
  type       VARCHAR(20) DEFAULT 'broadcast' CHECK (type IN ('broadcast','direct','help_request')),
  delivered  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_transfers (
  id           SERIAL PRIMARY KEY,
  initiated_by INT REFERENCES users(id),
  machine_id   INT REFERENCES machines(id),
  filename     VARCHAR(255),
  file_size_kb INT,
  direction    VARCHAR(10) CHECK (direction IN ('push','pull')),
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment (
  id                   SERIAL PRIMARY KEY,
  lab_id               INT REFERENCES labs(id),
  name                 VARCHAR(100) NOT NULL,
  category             VARCHAR(50),
  serial_number        VARCHAR(100),
  status               VARCHAR(20) DEFAULT 'working' CHECK (status IN ('working','faulty','maintenance')),
  purchase_date        DATE,
  last_service_date    DATE,
  warranty_expiry_date DATE,
  amc_vendor           VARCHAR(100),
  amc_expiry_date      DATE,
  usage_hours          INT DEFAULT 0,
  fault_count          INT DEFAULT 0,
  qr_token             VARCHAR(50) UNIQUE,
  created_at           TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance (
  id             SERIAL PRIMARY KEY,
  equipment_id   INT REFERENCES equipment(id),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  status         VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','in_progress','completed','overdue')),
  description    TEXT,
  technician     VARCHAR(100),
  cost           DECIMAL(10,2),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaints (
  id           SERIAL PRIMARY KEY,
  equipment_id INT REFERENCES equipment(id),
  raised_by    INT REFERENCES users(id),
  assigned_to  INT REFERENCES users(id),
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  photo_path   VARCHAR(255),
  status       VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  priority     VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  sla_deadline TIMESTAMP,
  sla_breached BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory (
  id               SERIAL PRIMARY KEY,
  lab_id           INT REFERENCES labs(id),
  item_name        VARCHAR(100) NOT NULL,
  category         VARCHAR(50),
  quantity         INT DEFAULT 0,
  min_threshold    INT DEFAULT 5,
  unit             VARCHAR(20),
  supplier_name    VARCHAR(100),
  supplier_contact VARCHAR(100),
  last_updated     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slots (
  id         SERIAL PRIMARY KEY,
  lab_id     INT REFERENCES labs(id),
  user_id    INT REFERENCES users(id),
  date       DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  status     VARCHAR(20) DEFAULT 'booked' CHECK (status IN ('booked','checked_in','completed','cancelled')),
  purpose    VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id                  SERIAL PRIMARY KEY,
  lab_id              INT REFERENCES labs(id),
  created_by          INT REFERENCES users(id),
  title               VARCHAR(200) NOT NULL,
  exam_date           DATE NOT NULL,
  start_time          TIME,
  end_time            TIME,
  status              VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','completed','cancelled')),
  auto_lock_threshold INT DEFAULT 40,
  violation_weights   JSONB DEFAULT '{"tab_switch":10,"fullscreen_exit":15,"clipboard_paste":20,"devtools_open":30,"new_process":25,"inactivity":2}',
  created_at          TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_events (
  id                 SERIAL PRIMARY KEY,
  session_id         INT REFERENCES exam_sessions(id),
  machine_id         INT REFERENCES machines(id),
  student_name       VARCHAR(100),
  event_type         VARCHAR(50),
  severity           VARCHAR(20) DEFAULT 'medium',
  trust_score_before INT,
  trust_score_after  INT,
  metadata           JSONB,
  recorded_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_trust_scores (
  id           SERIAL PRIMARY KEY,
  session_id   INT REFERENCES exam_sessions(id),
  machine_id   INT REFERENCES machines(id),
  student_name VARCHAR(100),
  trust_score  INT DEFAULT 100,
  is_locked    BOOLEAN DEFAULT FALSE,
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_predictions (
  id                 SERIAL PRIMARY KEY,
  equipment_id       INT REFERENCES equipment(id),
  days_until_service INT,
  next_service_date  DATE,
  risk_level         VARCHAR(20),
  anomaly_score      FLOAT,
  is_anomaly         BOOLEAN DEFAULT FALSE,
  feature_importance JSONB,
  predicted_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  action     VARCHAR(50) NOT NULL,
  table_name VARCHAR(50),
  record_id  INT,
  details    TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INT REFERENCES users(id),
  title      VARCHAR(200) NOT NULL,
  message    TEXT,
  type       VARCHAR(30) DEFAULT 'general',
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS power_policies (
  id               SERIAL PRIMARY KEY,
  lab_id           INT REFERENCES labs(id),
  idle_timeout_min INT DEFAULT 30,
  auto_shutdown    BOOLEAN DEFAULT FALSE,
  shutdown_time    TIME,
  days_active      VARCHAR(20) DEFAULT 'Mon-Fri'
);