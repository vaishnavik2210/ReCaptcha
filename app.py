from flask import Flask, render_template, request, jsonify, redirect, url_for
import joblib
import numpy as np
from collections import Counter
from xgboost import XGBClassifier

app = Flask(__name__)

# Load individual models
rf_model = joblib.load("models/random_forest_model.pkl")  # Load Random Forest from models directory
cat_model = joblib.load("models/catboost_model.pkl")  # Load CatBoost

# Load XGBoost model from JSON
xgb_model = XGBClassifier()
xgb_model.load_model("models/xgboost_model.json")  # Correct way to load XGBoost JSON from models directory

@app.route("/")
def home():
    return render_template("index.html")  # Render the UIDAI dashboard HTML

@app.route("/verification")
def verification():
    return render_template("verification.html")  # Render the shape verification page

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")  # Render the post-verification dashboard

@app.route("/predict", methods=["POST"])
def predict():
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Extract features from the data
        drag_time = data.get('dragDuration', 0) / 1000  # Convert to seconds
        
        # Calculate drop accuracy (0-100 scale)
        # If they matched the correct shape, accuracy is high (80-100)
        # If they didn't match, accuracy is low (0-20)
        correct_match = data.get('correctMatch', False)
        drop_accuracy = np.random.uniform(80, 100) if correct_match else np.random.uniform(0, 20)
        
        # Calculate mouse hesitation from the collected data
        hesitations = data.get('hesitations', 0)
        mouse_hesitation = hesitations
        
        # Create feature vector matching your model's expected input
        # Your model expects: drag_time, drop_accuracy, mouse_hesitation
        features = np.array([drag_time, drop_accuracy, mouse_hesitation]).reshape(1, -1)
        
        # Make predictions with each model
        rf_pred = rf_model.predict(features)[0]
        cat_pred = cat_model.predict(features)[0]
        xgb_pred = xgb_model.predict(features)[0]
        
        # Use voting to get final prediction
        predictions = [rf_pred, cat_pred, xgb_pred]
        final_prediction = Counter(predictions).most_common(1)[0][0]
        
        # Calculate confidence
        confidence = np.mean([
            rf_model.predict_proba(features)[0][1] if hasattr(rf_model, 'predict_proba') else 0.5,
            cat_model.predict_proba(features)[0][1] if hasattr(cat_model, 'predict_proba') else 0.5,
            xgb_model.predict_proba(features)[0][1] if hasattr(xgb_model, 'predict_proba') else 0.5
        ])
        
        # Return prediction result
        return jsonify({
            "isHuman": bool(final_prediction),
            "confidence": float(confidence),
            "features": {
                "drag_time": float(drag_time),
                "drop_accuracy": float(drop_accuracy),
                "mouse_hesitation": float(mouse_hesitation)
            }
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(debug=True)