"""
Flask API server for maritime optimization service
Runs alongside the Express server
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from optimizer import MaritimeOptimizer
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

optimizer = MaritimeOptimizer()


@app.route('/api/optimize/cii', methods=['POST'])
def optimize_cii():
    """
    Optimize CII rating
    
    Request body:
    {
        "currentParams": {
            "annualFuelConsumption": float,
            "distanceTraveled": float,
            "fuelType": str
        },
        "shipInfo": {
            "shipType": str,
            "capacity": float,
            "year": int
        },
        "targetRating": str (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        if 'currentParams' not in data or 'shipInfo' not in data:
            return jsonify({'success': False, 'error': 'Missing required fields'}), 400
        
        result = optimizer.optimize_cii(
            data['currentParams'],
            data['shipInfo'],
            data.get('targetRating')
        )
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/optimize/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'maritime-optimizer',
        'version': '1.0.0'
    })


if __name__ == '__main__':
    # Run on port 5001 (Express runs on 5000)
    app.run(host='0.0.0.0', port=5001, debug=True)
