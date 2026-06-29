-- LABS
INSERT INTO labs (name, location, capacity) VALUES
('Computer Science Lab', 'Block A, Room 101', 30),
('Physics Lab', 'Block B, Room 201', 25),
('Chemistry Lab', 'Block C, Room 301', 20);

-- USERS (passwords are all "password123" hashed with bcrypt)
INSERT INTO users (name, email, password, role) VALUES
('Admin User',       'admin@labcommand.com',       '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Lab Staff',        'staff@labcommand.com',        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff'),
('Dr. Sharma',       'invigilator@labcommand.com',  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'invigilator'),
('Student One',      'student@labcommand.com',      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

-- MACHINES (CS Lab)
INSERT INTO machines (lab_id, hostname, ip_address, os_info, status, row_pos, col_pos) VALUES
(1, 'PC-CS-01', '192.168.1.101', 'Windows 11', 'offline', 0, 0),
(1, 'PC-CS-02', '192.168.1.102', 'Windows 11', 'offline', 0, 1),
(1, 'PC-CS-03', '192.168.1.103', 'Windows 11', 'offline', 0, 2),
(1, 'PC-CS-04', '192.168.1.104', 'Windows 11', 'offline', 0, 3),
(1, 'PC-CS-05', '192.168.1.105', 'Windows 11', 'offline', 1, 0),
(1, 'PC-CS-06', '192.168.1.106', 'Windows 11', 'offline', 1, 1),
(1, 'PC-CS-07', '192.168.1.107', 'Windows 11', 'offline', 1, 2),
(1, 'PC-CS-08', '192.168.1.108', 'Windows 11', 'offline', 1, 3),
(2, 'PC-PH-01', '192.168.1.201', 'Ubuntu 22',  'offline', 0, 0),
(2, 'PC-PH-02', '192.168.1.202', 'Ubuntu 22',  'offline', 0, 1),
(3, 'PC-CH-01', '192.168.1.301', 'Windows 10', 'offline', 0, 0),
(3, 'PC-CH-02', '192.168.1.302', 'Windows 10', 'offline', 0, 1);

-- EQUIPMENT (CS Lab)
INSERT INTO equipment (lab_id, name, category, serial_number, status, purchase_date, last_service_date, usage_hours, fault_count) VALUES
(1, 'Dell OptiPlex Desktop #1', 'Computer',  'DL-001', 'working',     '2022-06-15', '2024-11-01', 1200, 1),
(1, 'Dell OptiPlex Desktop #2', 'Computer',  'DL-002', 'working',     '2022-06-15', '2024-11-01', 1100, 0),
(1, 'Dell OptiPlex Desktop #3', 'Computer',  'DL-003', 'faulty',      '2022-06-15', '2024-09-01', 1800, 4),
(1, 'HP LaserJet Printer',      'Printer',   'HP-001', 'working',     '2021-03-10', '2024-10-15',  600, 2),
(1, 'Cisco Switch 24-Port',     'Network',   'CS-001', 'working',     '2020-08-20', '2024-08-01', 3200, 0),
(1, 'Projector Epson EB-X51',   'AV',        'EP-001', 'working',     '2021-09-15', '2024-09-10', 1500, 1),
(1, 'UPS APC 1500VA',           'Power',     'UP-001', 'maintenance', '2021-01-05', '2024-07-20', 2100, 2),
(2, 'Digital Oscilloscope',     'Instrument','PH-OSC', 'working',     '2020-05-01', '2024-05-15', 2800, 1),
(2, 'Function Generator',       'Instrument','PH-FG',  'faulty',      '2019-08-10', '2023-12-01', 3600, 5),
(3, 'Digital Weighing Balance', 'Instrument','CH-WB',  'working',     '2021-06-01', '2024-10-01',  800, 0),
(3, 'Centrifuge Machine',       'Instrument','CH-CF',  'faulty',      '2019-05-20', '2023-10-01', 2400, 4);

-- INVENTORY (CS Lab)
INSERT INTO inventory (lab_id, item_name, category, quantity, min_threshold, unit, supplier_name) VALUES
(1, 'A4 Paper Reams',        'Stationery',  8,  5, 'reams',  'Sharma Stationery'),
(1, 'Printer Ink Cartridge', 'Consumable',  3,  5, 'pcs',    'HP India'),
(1, 'USB Flash Drives 16GB', 'Accessory',  12,  5, 'pcs',    'SanDisk Store'),
(1, 'Ethernet Cables Cat6',  'Cable',      15,  5, 'pcs',    'Local Vendor'),
(1, 'Computer Mouse',        'Peripheral',  4,  5, 'pcs',    'Logitech India'),
(2, 'Connecting Wires Set',  'Component',   8,  5, 'sets',   'Electronics Hub'),
(2, 'Resistor Kit',          'Component',   6,  5, 'sets',   'Electronics Hub'),
(2, 'Battery 9V',            'Component',   3, 10, 'pcs',    'Duracell Store'),
(3, 'Safety Gloves',         'Safety',      5, 10, 'pairs',  'SafeGuard India'),
(3, 'Test Tubes',            'Glassware',  40, 20, 'pcs',    'LabGlass Co');

-- MAINTENANCE
INSERT INTO maintenance (equipment_id, scheduled_date, status, description, technician, cost) VALUES
(3,  CURRENT_DATE - 10, 'in_progress', 'Hard disk replacement',     'Ravi Kumar',      3500.00),
(9,  CURRENT_DATE + 5,  'scheduled',   'Function generator repair',  'External Vendor', 5000.00),
(7,  CURRENT_DATE + 14, 'scheduled',   'UPS battery replacement',    'APC Service',     2000.00),
(11, CURRENT_DATE + 3,  'scheduled',   'Centrifuge motor repair',    'Lab Technician',  4500.00);

-- COMPLAINTS
INSERT INTO complaints (equipment_id, raised_by, assigned_to, title, description, status, priority) VALUES
(3,  4, 2, 'Desktop #3 blue screen error',    'Shows BSOD on startup repeatedly',       'in_progress', 'high'),
(9,  4, 2, 'Function generator faulty output','Output waveform distorted above 10kHz',  'open',        'high'),
(11, 4, 2, 'Centrifuge making noise',         'Loud grinding sound during operation',   'open',        'high');

-- EXAM SESSIONS
INSERT INTO exam_sessions (lab_id, created_by, title, exam_date, start_time, end_time) VALUES
(1, 3, 'MCA Semester Exam — Python Programming', CURRENT_DATE + 7,  '09:00', '12:00'),
(2, 3, 'BSc Physics Practical Examination',      CURRENT_DATE + 10, '10:00', '13:00');

-- SOFTWARE WHITELIST (CS Lab)
INSERT INTO software_whitelist (lab_id, process_name, display_name, is_allowed) VALUES
(1, 'Code',        'VS Code',         true),
(1, 'python3',     'Python',          true),
(1, 'node',        'Node.js',         true),
(1, 'chrome',      'Google Chrome',   true),
(1, 'firefox',     'Firefox',         true),
(1, 'Terminal',    'Terminal',        true),
(1, 'Finder',      'Finder',          true);

-- NOTIFICATIONS
INSERT INTO notifications (user_id, title, message, type) VALUES
(1, 'Low Stock: Printer Ink',  'CS Lab printer ink below minimum (3 pcs remaining)', 'inventory'),
(1, 'Low Stock: Battery 9V',   'Physics Lab batteries below minimum (3 pcs)',        'inventory'),
(1, 'Low Stock: Safety Gloves','Chemistry Lab safety gloves below minimum',          'inventory'),
(1, 'Maintenance Due',         'UPS APC scheduled for maintenance in 14 days',       'maintenance'),
(2, 'Complaint Assigned',      'New complaint: Desktop #3 blue screen error',        'complaint');

-- POWER POLICIES
INSERT INTO power_policies (lab_id, idle_timeout_min, auto_shutdown, shutdown_time, days_active) VALUES
(1, 30, true,  '19:00', 'Mon-Fri'),
(2, 30, true,  '18:00', 'Mon-Fri'),
(3, 30, false, '18:00', 'Mon-Fri');