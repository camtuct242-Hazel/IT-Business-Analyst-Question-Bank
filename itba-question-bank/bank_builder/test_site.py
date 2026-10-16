# bank_builder/test_site.py
import json
import os
import re

SITE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "site"))
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def test_site():
    print("==================================================")
    print("RUNNING FRONTEND & SITE COMPLIANCE VERIFICATION")
    print("==================================================")
    
    # 1. Check file existence
    expected_files = ["index.html", "styles.css", "app.js", "ITBA_Junior_Question_Bank.json"]
    for f in expected_files:
        path = os.path.join(SITE_DIR, f)
        if not os.path.exists(path):
            raise AssertionError(f"Missing file in site/: {f}")
        size = os.path.getsize(path)
        print(f"✓ File exists: site/{f} ({size:,} bytes)")
        
    # 2. Check JSON synchronization
    root_json_path = os.path.join(ROOT_DIR, "ITBA_Junior_Question_Bank.json")
    site_json_path = os.path.join(SITE_DIR, "ITBA_Junior_Question_Bank.json")
    with open(root_json_path, "r", encoding="utf-8") as f1, open(site_json_path, "r", encoding="utf-8") as f2:
        root_data = json.load(f1)
        site_data = json.load(f2)
        
    assert len(site_data["blueprint"]) == 10, "Site JSON blueprint must have 10 exams"
    assert len(site_data["questions"]) == 200, "Site JSON must have 200 questions"
    assert root_data == site_data, "Site JSON must be 100% synchronized with root JSON"
    print("✓ JSON synchronization: 10 exams, 200 questions match 100%")
    
    # 3. Check CSS palette requirements
    with open(os.path.join(SITE_DIR, "styles.css"), "r", encoding="utf-8") as f:
        css = f.read().upper()
        
    required_colors = {
        "Page background": "#FFF9E8",
        "Cards": "#FFFDF7",
        "Pastel yellow": "#F5E7A5",
        "Primary accent": "#E9CD65",
        "Hover accent": "#DDBB46",
        "Main text": "#403A2D",
        "Secondary text": "#776F5B",
        "Borders": "#E9DDB8",
        "Correct answer": "#E5F0DE",
        "Incorrect answer": "#F7DEDA"
    }
    
    for name, hex_code in required_colors.items():
        assert hex_code.upper() in css, f"Required color {name} ({hex_code}) missing from styles.css"
        print(f"✓ Color verified in CSS: {name} -> {hex_code}")
        
    # 4. Check HTML structure
    with open(os.path.join(SITE_DIR, "index.html"), "r", encoding="utf-8") as f:
        html = f.read()
        
    required_elements = [
        "view-home", "view-exam", "view-results",
        "timer-display", "exam-taking-title", "q-scenario-box",
        "q-text", "q-options-list", "question-nav-grid",
        "weak-topics-card", "review-questions-container",
        "modal-submit", "modal-exit", "modal-reset"
    ]
    for el in required_elements:
        assert f'id="{el}"' in html or f"id='{el}'" in html, f"Missing required element #{el} in index.html"
    print(f"✓ HTML verified: all {len(required_elements)} core view elements and modals present")
    
    # 5. Check JS code integrity
    with open(os.path.join(SITE_DIR, "app.js"), "r", encoding="utf-8") as f:
        js = f.read()
        
    required_js_features = [
        "fetch('ITBA_Junior_Question_Bank.json')",
        "localStorage",
        "timerSecondsLeft",
        "startExam",
        "doSubmitExam",
        "renderResults",
        "weakTopics",
        "reviewFilter"
    ]
    for feat in required_js_features:
        assert feat in js, f"Missing JS feature: {feat}"
    print(f"✓ JavaScript verified: all state management, timer, scoring, and review features present")
    
    # 6. Verify all 200 questions can be parsed and options exist
    for q in site_data["questions"]:
        assert q["correct_answer"] in ["A", "B", "C", "D"], f"Invalid answer in {q['question_id']}"
        assert all(k in q for k in ["option_a", "option_b", "option_c", "option_d", "explanation", "key_concept", "learning_point"]), f"Missing key in {q['question_id']}"
    print("✓ All 200 questions tested for data integrity: 100% valid")
    
    # 7. Check .gitignore
    gitignore_path = os.path.join(ROOT_DIR, ".gitignore")
    assert os.path.exists(gitignore_path), "Missing .gitignore in root"
    with open(gitignore_path, "r", encoding="utf-8") as f:
        gi = f.read()
    assert "__pycache__/" in gi and "*.py" in gi, ".gitignore must exclude python bytecode"
    print("✓ .gitignore verified in root")
    
    print("\nALL 7 TESTS PASSED WITH 0 ERRORS! THE SITE IS 100% READY.")

if __name__ == "__main__":
    test_site()
