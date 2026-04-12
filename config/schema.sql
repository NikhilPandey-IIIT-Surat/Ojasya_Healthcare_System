-- Ojasya Healthcare System - MySQL Schema

CREATE DATABASE IF NOT EXISTS ojasya_healthcare;
USE ojasya_healthcare;

-- Users Table (patients)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  dob DATE,
  gender ENUM('male','female','other'),
  address TEXT,
  blood_group VARCHAR(5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Doctors Table
CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  specialization VARCHAR(100),
  doctor_type ENUM('junior_resident','senior_resident') NOT NULL,
  qualification VARCHAR(200),
  license_number VARCHAR(50) UNIQUE,
  is_on_leave BOOLEAN DEFAULT FALSE,
  leave_reason TEXT,
  leave_from DATE,
  leave_to DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Receptionists Table
CREATE TABLE receptionists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  employee_id VARCHAR(20) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacists Table
CREATE TABLE pharmacists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  password_hash VARCHAR(255) NOT NULL,
  license_number VARCHAR(50) UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Table
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diseases / Diagnoses Master
CREATE TABLE diseases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  icd_code VARCHAR(20),
  description TEXT,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicines Master
CREATE TABLE medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  generic_name VARCHAR(200),
  medicine_type ENUM('ayurveda','allopathy','homeopathy') NOT NULL,
  dosage_form VARCHAR(50),
  strength VARCHAR(50),
  manufacturer VARCHAR(100),
  price DECIMAL(10,2),
  stock_quantity INT DEFAULT 0,
  description TEXT,
  precautions TEXT,
  side_effects TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient Registration by Receptionist
CREATE TABLE patient_registrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  receptionist_id INT NOT NULL,
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  chief_complaint TEXT,
  visit_type ENUM('opd','emergency','follow_up') DEFAULT 'opd',
  status ENUM('registered','waiting','in_consultation','completed','cancelled') DEFAULT 'registered',
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (receptionist_id) REFERENCES receptionists(id)
);

-- Fee Collection
CREATE TABLE fee_collections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  patient_id INT NOT NULL,
  receptionist_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash','upi','neft_rtgs','cheque') NOT NULL,
  payment_status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  transaction_id VARCHAR(100),
  cheque_number VARCHAR(50),
  bank_name VARCHAR(100),
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id),
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (receptionist_id) REFERENCES receptionists(id)
);

-- Consultations / Appointments
CREATE TABLE consultations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  medication_type ENUM('ayurveda','allopathy','homeopathy') NOT NULL,
  chief_complaint TEXT,
  symptoms TEXT,
  diagnosis TEXT,
  diagnosis_disease_id INT,
  notes TEXT,
  follow_up_date DATE,
  status ENUM('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id),
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  FOREIGN KEY (diagnosis_disease_id) REFERENCES diseases(id)
);

-- Prescriptions
CREATE TABLE prescriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  consultation_id INT NOT NULL,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  status ENUM('pending','dispensed','completed') DEFAULT 'pending',
  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(id)
);

-- Prescription Items
CREATE TABLE prescription_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT NOT NULL,
  medicine_id INT NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(50),
  quantity INT,
  instructions TEXT,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Pharmacist Dispensing Records
CREATE TABLE dispensing_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prescription_id INT NOT NULL,
  pharmacist_id INT NOT NULL,
  patient_id INT NOT NULL,
  dispensed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dosage_instructions TEXT,
  precautions_given TEXT,
  status ENUM('dispensed','partial','returned') DEFAULT 'dispensed',
  notes TEXT,
  FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
  FOREIGN KEY (pharmacist_id) REFERENCES pharmacists(id),
  FOREIGN KEY (patient_id) REFERENCES users(id)
);

-- Messages (Internal Communication)
CREATE TABLE messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_type ENUM('doctor','receptionist','pharmacist','admin') NOT NULL,
  sender_id INT NOT NULL,
  receiver_type ENUM('doctor','receptionist','pharmacist','admin') NOT NULL,
  receiver_id INT NOT NULL,
  subject VARCHAR(200),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nutritional Deficiency Module
CREATE TABLE nutritional_conditions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  condition_name VARCHAR(200) NOT NULL,
  symptoms JSON NOT NULL,
  possible_reasons TEXT,
  recommended_nutrients TEXT,
  recommended_foods TEXT,
  severity ENUM('mild','moderate','severe') DEFAULT 'moderate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bills
CREATE TABLE bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  registration_id INT NOT NULL,
  consultation_id INT,
  prescription_id INT,
  fee_collection_id INT,
  bill_number VARCHAR(50) UNIQUE NOT NULL,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  medicine_cost DECIMAL(10,2) DEFAULT 0,
  other_charges DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('unpaid','partial','paid') DEFAULT 'unpaid',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by_type ENUM('receptionist','admin'),
  generated_by_id INT,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (registration_id) REFERENCES patient_registrations(id)
);

-- Notifications
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_type ENUM('patient','doctor','receptionist','pharmacist','admin') NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin
INSERT INTO admins (full_name, email, password_hash) VALUES
('System Admin', 'admin@ojasya.com', '$2b$10$rX8p8UxHl9p.q1n8DdZZs.VqT5gP3mYLkJ8hN6kO7R2mHjWsxeQdu');
-- Default password: Admin@123

-- Insert sample nutritional conditions
INSERT INTO nutritional_conditions (condition_name, symptoms, possible_reasons, recommended_nutrients, recommended_foods) VALUES
('Iron Deficiency Anemia', '["fatigue","pale skin","shortness of breath","dizziness","cold hands","brittle nails","headaches","chest pain"]', 
 'Poor dietary intake, blood loss, poor absorption, pregnancy', 
 'Iron, Vitamin C (enhances iron absorption), Folate, Vitamin B12',
 'Spinach, lentils, red meat, beans, fortified cereals, citrus fruits, broccoli'),
('Vitamin D Deficiency', '["bone pain","muscle weakness","fatigue","depression","hair loss","slow wound healing","frequent illness"]',
 'Limited sun exposure, poor dietary intake, malabsorption, obesity',
 'Vitamin D3, Calcium, Magnesium, Vitamin K2',
 'Fatty fish, fortified milk, egg yolks, mushrooms, sunlight exposure'),
('Vitamin B12 Deficiency', '["numbness tingling hands feet","fatigue","weakness","memory problems","mood changes","pale yellowish skin","mouth sores"]',
 'Vegetarian/vegan diet, pernicious anemia, digestive disorders, age',
 'Vitamin B12, Folate, Iron',
 'Meat, fish, dairy, eggs, fortified cereals, nutritional yeast'),
('Calcium Deficiency', '["muscle cramps","numbness","brittle nails","dental problems","bone pain","fatigue","irregular heartbeat"]',
 'Low dairy intake, vitamin D deficiency, kidney disease, certain medications',
 'Calcium, Vitamin D, Magnesium, Phosphorus',
 'Dairy products, leafy greens, almonds, sardines, fortified plant milk, tofu'),
('Magnesium Deficiency', '["muscle cramps","anxiety","insomnia","fatigue","headaches","irregular heartbeat","constipation"]',
 'Poor diet, digestive diseases, type 2 diabetes, alcoholism, certain medications',
 'Magnesium, Vitamin B6, Potassium',
 'Dark chocolate, avocados, nuts, seeds, legumes, whole grains, leafy greens'),
('Vitamin C Deficiency', '["fatigue","irritability","joint pain","bleeding gums","slow healing","rough bumpy skin","frequent colds"]',
 'Poor fruit and vegetable intake, smoking, cooking methods',
 'Vitamin C, Bioflavonoids',
 'Citrus fruits, bell peppers, strawberries, broccoli, kiwi, tomatoes'),
('Zinc Deficiency', '["loss of taste smell","poor wound healing","hair loss","diarrhea","reduced immunity","eye skin problems"]',
 'Low dietary intake, vegetarian diet, digestive disorders, pregnancy',
 'Zinc, Copper, Selenium',
 'Oysters, red meat, poultry, beans, nuts, seeds, whole grains'),
('Omega-3 Deficiency', '["dry skin","depression","joint pain","poor memory","fatigue","dry eyes","brittle hair nails"]',
 'Low fish intake, high omega-6 diet, poor absorption',
 'Omega-3 fatty acids (EPA, DHA, ALA)',
 'Fatty fish, flaxseeds, chia seeds, walnuts, hemp seeds');

-- Sample diseases
INSERT INTO diseases (name, icd_code, description, category) VALUES
('Type 2 Diabetes Mellitus', 'E11', 'Chronic metabolic disorder', 'Endocrine'),
('Hypertension', 'I10', 'High blood pressure', 'Cardiovascular'),
('Common Cold', 'J00', 'Upper respiratory infection', 'Respiratory'),
('Migraine', 'G43', 'Recurrent headache disorder', 'Neurological'),
('Gastritis', 'K29', 'Stomach lining inflammation', 'Gastrointestinal'),
('Asthma', 'J45', 'Chronic airway inflammation', 'Respiratory'),
('Arthritis', 'M19', 'Joint inflammation', 'Musculoskeletal'),
('Anxiety Disorder', 'F41', 'Mental health condition', 'Psychiatric');

-- Sample medicines
INSERT INTO medicines (name, generic_name, medicine_type, dosage_form, strength, price, stock_quantity, precautions) VALUES
('Ashwagandha Capsules', 'Withania somnifera', 'ayurveda', 'Capsule', '500mg', 250.00, 100, 'Avoid during pregnancy. Take with milk.'),
('Triphala Churna', 'Triphala', 'ayurveda', 'Powder', '5g/dose', 180.00, 80, 'Take with warm water before bed.'),
('Brahmi Syrup', 'Bacopa monnieri', 'ayurveda', 'Syrup', '200mg/10ml', 320.00, 60, 'Safe for children above 5 years.'),
('Paracetamol', 'Acetaminophen', 'allopathy', 'Tablet', '500mg', 15.00, 500, 'Do not exceed 4g per day. Avoid alcohol.'),
('Amoxicillin', 'Amoxicillin trihydrate', 'allopathy', 'Capsule', '500mg', 85.00, 200, 'Complete full course. Inform doctor of allergies.'),
('Metformin', 'Metformin HCl', 'allopathy', 'Tablet', '500mg', 45.00, 300, 'Take with meals. Monitor blood sugar.'),
('Bryonia Alba', 'Bryonia alba', 'homeopathy', 'Globules', '30C', 120.00, 150, 'Avoid coffee and camphor during treatment.'),
('Nux Vomica', 'Strychnos nux-vomica', 'homeopathy', 'Drops', '200C', 95.00, 120, 'Avoid stimulants. Take 30 min before meals.'),
('Arnica Montana', 'Arnica montana', 'homeopathy', 'Globules', '30C', 110.00, 90, 'Do not touch globules. Drop directly under tongue.');
