-- Add length constraints to text fields to prevent storage bloat and ensure data quality

-- Transactions table constraints
ALTER TABLE transactions 
  ADD CONSTRAINT check_category_length 
    CHECK (char_length(TRIM(category)) BETWEEN 1 AND 100),
  ADD CONSTRAINT check_transaction_description_length 
    CHECK (description IS NULL OR char_length(description) <= 500);

-- Lend/Borrow table constraints
ALTER TABLE lend_borrow 
  ADD CONSTRAINT check_person_name_length 
    CHECK (char_length(TRIM(person_name)) BETWEEN 1 AND 100),
  ADD CONSTRAINT check_lend_borrow_description_length 
    CHECK (description IS NULL OR char_length(description) <= 500);