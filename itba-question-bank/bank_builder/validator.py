# bank_builder/validator.py
import sys
from blueprint_data import BLUEPRINT
from exam01 import EXAM01_QUESTIONS
from exam02 import EXAM02_QUESTIONS
from exam03 import EXAM03_QUESTIONS
from exam04 import EXAM04_QUESTIONS
from exam05 import EXAM05_QUESTIONS
from exam06 import EXAM06_QUESTIONS
from exam07 import EXAM07_QUESTIONS
from exam08 import EXAM08_QUESTIONS
from exam09 import EXAM09_QUESTIONS
from exam10 import EXAM10_QUESTIONS

ALL_EXAMS = [
    EXAM01_QUESTIONS,
    EXAM02_QUESTIONS,
    EXAM03_QUESTIONS,
    EXAM04_QUESTIONS,
    EXAM05_QUESTIONS,
    EXAM06_QUESTIONS,
    EXAM07_QUESTIONS,
    EXAM08_QUESTIONS,
    EXAM09_QUESTIONS,
    EXAM10_QUESTIONS,
]

def validate_all():
    errors = []
    all_questions = []
    
    # 1. Check blueprint
    if len(BLUEPRINT) != 10:
        errors.append(f"Blueprint has {len(BLUEPRINT)} exams instead of 10.")
    
    # 2. Check each exam
    seen_qids = set()
    seen_texts = set()
    total_easy = 0
    total_inter = 0
    total_adv = 0
    scenario_count = 0
    theory_count = 0
    
    for exam_idx, exam_questions in enumerate(ALL_EXAMS, start=1):
        exam_id = f"EXAM{exam_idx:02d}"
        if len(exam_questions) != 20:
            errors.append(f"Exam {exam_id} has {len(exam_questions)} questions instead of 20.")
            
        easy_count = 0
        inter_count = 0
        adv_count = 0
        
        for q_idx, q in enumerate(exam_questions, start=1):
            qid = q.get("question_id")
            all_questions.append(q)
            
            # Check ID format
            expected_qid = f"Q{(exam_idx-1)*20 + q_idx:03d}"
            if qid != expected_qid:
                errors.append(f"Question at index {exam_idx}:{q_idx} has ID '{qid}' but expected '{expected_qid}'.")
                
            if qid in seen_qids:
                errors.append(f"Duplicate question ID '{qid}'.")
            seen_qids.add(qid)
            
            # Check question number
            if q.get("question_number") != q_idx:
                errors.append(f"Question {qid} has question_number {q.get('question_number')} but expected {q_idx}.")
                
            if q.get("exam_id") != exam_id:
                errors.append(f"Question {qid} has exam_id '{q.get('exam_id')}' but expected '{exam_id}'.")
                
            # Check difficulty
            diff = q.get("difficulty")
            if diff == "Dễ":
                easy_count += 1
                total_easy += 1
            elif diff == "Khá":
                inter_count += 1
                total_inter += 1
            elif diff == "Khó":
                adv_count += 1
                total_adv += 1
            else:
                errors.append(f"Question {qid} has invalid difficulty: '{diff}'.")
                
            # Check question type and scenario
            qtype = q.get("question_type")
            scenario = q.get("scenario")
            if scenario or "Tình huống" in str(qtype):
                scenario_count += 1
            else:
                theory_count += 1
                
            # Check options
            for opt in ["option_a", "option_b", "option_c", "option_d"]:
                val = q.get(opt)
                if not val or not isinstance(val, str) or len(val.strip()) == 0:
                    errors.append(f"Question {qid} has empty or invalid {opt}.")
                    
            # Check correct answer
            ans = q.get("correct_answer")
            if ans not in ["A", "B", "C", "D"]:
                errors.append(f"Question {qid} has invalid correct_answer: '{ans}'.")
                
            # Check explanations
            for field in ["explanation", "why_a_incorrect", "why_b_incorrect", "why_c_incorrect", "why_d_incorrect", "key_concept", "learning_point", "reference_url"]:
                val = q.get(field)
                if not val or not isinstance(val, str) or len(val.strip()) == 0:
                    errors.append(f"Question {qid} has empty or missing field '{field}'.")
                    
            # Duplicate text check
            q_text = q.get("question_text", "").strip()
            if q_text in seen_texts:
                errors.append(f"Question {qid} has duplicate question_text.")
            seen_texts.add(q_text)
            
        # Check distribution in this exam
        if easy_count != 10:
            errors.append(f"Exam {exam_id} has {easy_count} Dễ questions instead of 10.")
        if inter_count != 5:
            errors.append(f"Exam {exam_id} has {inter_count} Khá questions instead of 5.")
        if adv_count != 5:
            errors.append(f"Exam {exam_id} has {adv_count} Khó questions instead of 5.")
            
    # Check postman coverage in Exam 9
    postman_vars = [q for q in EXAM09_QUESTIONS if any(k in q.get("question_text", "") + q.get("subtopic", "") for k in ["biến", "variable", "Environment", "Postman"])]
    if len(postman_vars) < 3:
        errors.append(f"Exam 9 has only {len(postman_vars)} Postman variable questions (requirement: 3 to 5).")

    print("=" * 60)
    print("QUALITY AUDIT RESULTS")
    print("=" * 60)
    print(f"Total Questions Evaluated: {len(all_questions)}")
    print(f"Total Exams: {len(ALL_EXAMS)}")
    print(f"Total Easy (Dễ): {total_easy} (Expected: 100)")
    print(f"Total Intermediate (Khá): {total_inter} (Expected: 50)")
    print(f"Total Advanced (Khó): {total_adv} (Expected: 50)")
    print(f"Scenario/Application Questions: {scenario_count} (Target: ~120)")
    print(f"Theory/Conceptual Questions: {theory_count} (Target: ~80)")
    print(f"Exam 9 Postman Variable Questions: {len(postman_vars)}")
    print(f"Errors Found: {len(errors)}")
    
    if errors:
        print("\nERRORS DETAIL:")
        for err in errors[:20]:
            print(f" - {err}")
        if len(errors) > 20:
            print(f" ... and {len(errors) - 20} more errors.")
        sys.exit(1)
    else:
        print("\nALL AUDIT CHECKS PASSED PERFECTLY! 100% COMPLIANT.")
        return all_questions

if __name__ == "__main__":
    validate_all()
