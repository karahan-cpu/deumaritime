"""
Maritime Emissions Optimization Service
Uses scipy.optimize for advanced optimization of ship operational parameters
"""

from scipy.optimize import minimize, differential_evolution
import numpy as np
from typing import Dict, List, Optional, Tuple
import json


class MaritimeOptimizer:
    """Optimizer for maritime emissions and compliance calculations"""
    
    # CO2 conversion factors (tonnes CO2 per tonne fuel)
    CO2_FACTORS = {
        'HFO': 3.114,
        'MDO': 3.206,
        'MGO': 3.206,
        'LNG': 2.750,
        'Methanol': 1.375,
        'Ammonia': 0.0,
        'LPG': 3.000,
    }
    
    # CII baselines (a, c parameters)
    CII_BASELINES = {
        'Bulk Carrier': {'a': 4745, 'c': 0.622},
        'Oil Tanker': {'a': 5247, 'c': 0.610},
        'Container Ship': {'a': 1984, 'c': 0.489},
        'LNG Carrier': {'a': 9.827, 'c': 0},
        'General Cargo': {'a': 31948, 'c': 0.792},
    }
    
    # CII reduction factors by year
    CII_REDUCTION_FACTORS = {
        2023: 0.05, 2024: 0.07, 2025: 0.09, 2026: 0.11, 2027: 0.13,
        2028: 0.15, 2029: 0.17, 2030: 0.19, 2031: 0.21, 2032: 0.23,
        2033: 0.25, 2034: 0.27, 2035: 0.29, 2036: 0.31, 2037: 0.33,
        2038: 0.35, 2039: 0.37, 2040: 0.39,
    }
    
    def __init__(self):
        pass
    
    def calculate_cii(self, fuel_consumption: float, distance: float, 
                     capacity: float, fuel_type: str) -> float:
        """Calculate Carbon Intensity Indicator"""
        cf = self.CO2_FACTORS.get(fuel_type, 3.114)
        co2_emissions = fuel_consumption * cf
        transport_work = capacity * distance
        if transport_work == 0:
            return float('inf')
        return (co2_emissions / transport_work) * 1_000_000
    
    def calculate_required_cii(self, ship_type: str, capacity: float, year: int) -> float:
        """Calculate required CII for given ship type, capacity, and year"""
        baseline = self.CII_BASELINES.get(ship_type, self.CII_BASELINES['Bulk Carrier'])
        base_cii = baseline['a'] * (capacity ** -baseline['c'])
        
        reduction = self.CII_REDUCTION_FACTORS.get(year, 0.09)
        return base_cii * (1 - reduction)
    
    def get_cii_rating(self, attained_cii: float, required_cii: float) -> str:
        """Get CII rating (A-E) based on attained vs required"""
        ratio = attained_cii / required_cii
        
        if ratio <= 0.88:
            return 'A'
        elif ratio <= 0.94:
            return 'B'
        elif ratio <= 1.06:
            return 'C'
        elif ratio <= 1.18:
            return 'D'
        else:
            return 'E'
    
    def get_target_cii_for_rating(self, required_cii: float, target_rating: str) -> float:
        """Calculate the maximum CII value for a target rating"""
        rating_thresholds = {
            'A': 0.88,
            'B': 0.94,
            'C': 1.06,
            'D': 1.18,
        }
        
        if target_rating not in rating_thresholds:
            return required_cii * 0.88  # Default to A rating
        
        return required_cii * rating_thresholds[target_rating]
    
    def optimize_cii(self, current_params: Dict, ship_info: Dict, 
                    target_rating: Optional[str] = None) -> Dict:
        """
        Optimize operational parameters to achieve better CII rating
        
        Args:
            current_params: {
                'annualFuelConsumption': float,
                'distanceTraveled': float,
                'fuelType': str
            }
            ship_info: {
                'shipType': str,
                'capacity': float,
                'year': int
            }
            target_rating: Target CII rating (A-E), defaults to one level better
        
        Returns:
            Optimization results with recommendations
        """
        # Calculate current CII and rating
        current_cii = self.calculate_cii(
            current_params['annualFuelConsumption'],
            current_params['distanceTraveled'],
            ship_info['capacity'],
            current_params['fuelType']
        )
        
        required_cii = self.calculate_required_cii(
            ship_info['shipType'],
            ship_info['capacity'],
            ship_info['year']
        )
        
        current_rating = self.get_cii_rating(current_cii, required_cii)
        
        # Determine target rating (one level better if not specified)
        if target_rating is None:
            rating_order = ['E', 'D', 'C', 'B', 'A']
            current_idx = rating_order.index(current_rating)
            target_rating = rating_order[min(current_idx + 1, 4)]
        
        # If already at A rating, return current params
        if current_rating == 'A':
            return {
                'success': True,
                'message': 'Already at optimal A rating',
                'currentRating': current_rating,
                'targetRating': 'A',
                'currentCII': round(current_cii, 2),
                'targetCII': round(required_cii * 0.88, 2),
                'recommendations': [],
                'optimizedParams': current_params
            }
        
        # Calculate target CII value
        target_cii = self.get_target_cii_for_rating(required_cii, target_rating)
        
        # Optimization bounds
        fuel_min = current_params['annualFuelConsumption'] * 0.7  # Can reduce up to 30%
        fuel_max = current_params['annualFuelConsumption'] * 1.0  # Don't increase
        dist_min = current_params['distanceTraveled'] * 0.8  # Can reduce up to 20%
        dist_max = current_params['distanceTraveled'] * 1.2  # Can increase up to 20%
        
        # Define objective function (minimize CII)
        def objective(x):
            fuel, distance = x
            cii = self.calculate_cii(fuel, distance, ship_info['capacity'], 
                                     current_params['fuelType'])
            # Penalize if above target
            penalty = max(0, cii - target_cii) * 100
            return cii + penalty
        
        # Initial guess
        x0 = np.array([current_params['annualFuelConsumption'], 
                       current_params['distanceTraveled']])
        
        # Bounds
        bounds = [(fuel_min, fuel_max), (dist_min, dist_max)]
        
        # Optimize using differential evolution for global optimization
        result = differential_evolution(
            objective,
            bounds,
            maxiter=100,
            seed=42,
            atol=0.01,
            tol=0.01
        )
        
        optimized_fuel, optimized_distance = result.x
        optimized_cii = self.calculate_cii(
            optimized_fuel, optimized_distance, 
            ship_info['capacity'], current_params['fuelType']
        )
        optimized_rating = self.get_cii_rating(optimized_cii, required_cii)
        
        # Generate recommendations
        recommendations = []
        
        fuel_reduction_pct = ((current_params['annualFuelConsumption'] - optimized_fuel) / 
                             current_params['annualFuelConsumption']) * 100
        if fuel_reduction_pct > 1:
            recommendations.append({
                'type': 'fuel_reduction',
                'title': 'Reduce Fuel Consumption',
                'description': f'Reduce annual fuel consumption by {fuel_reduction_pct:.1f}%',
                'from': round(current_params['annualFuelConsumption'], 2),
                'to': round(optimized_fuel, 2),
                'unit': 'tonnes',
                'impact': 'high',
                'suggestions': [
                    'Optimize speed (slow steaming)',
                    'Improve hull maintenance and cleaning',
                    'Optimize trim and ballast',
                    'Use weather routing systems'
                ]
            })
        
        distance_change_pct = ((optimized_distance - current_params['distanceTraveled']) / 
                              current_params['distanceTraveled']) * 100
        if abs(distance_change_pct) > 1:
            if distance_change_pct > 0:
                recommendations.append({
                    'type': 'distance_increase',
                    'title': 'Optimize Route Efficiency',
                    'description': f'Increase operational distance by {distance_change_pct:.1f}% while maintaining fuel efficiency',
                    'from': round(current_params['distanceTraveled'], 2),
                    'to': round(optimized_distance, 2),
                    'unit': 'nautical miles',
                    'impact': 'medium',
                    'suggestions': [
                        'Optimize cargo capacity utilization',
                        'Reduce ballast voyages',
                        'Improve route planning'
                    ]
                })
            else:
                recommendations.append({
                    'type': 'distance_reduction',
                    'title': 'Reduce Unnecessary Distance',
                    'description': f'Reduce travel distance by {abs(distance_change_pct):.1f}%',
                    'from': round(current_params['distanceTraveled'], 2),
                    'to': round(optimized_distance, 2),
                    'unit': 'nautical miles',
                    'impact': 'medium',
                    'suggestions': [
                        'Optimize port selection',
                        'Improve route planning',
                        'Reduce waiting times'
                    ]
                })
        
        # Check if fuel switching could help
        if current_params['fuelType'] in ['HFO', 'MDO', 'MGO']:
            alternative_fuels = []
            for fuel_type in ['LNG', 'Methanol']:
                alt_cii = self.calculate_cii(
                    optimized_fuel, optimized_distance,
                    ship_info['capacity'], fuel_type
                )
                alt_rating = self.get_cii_rating(alt_cii, required_cii)
                if alt_rating < current_rating or (alt_rating == target_rating and alt_cii < optimized_cii):
                    alternative_fuels.append({
                        'fuel': fuel_type,
                        'cii': round(alt_cii, 2),
                        'rating': alt_rating,
                        'improvement': round(((current_cii - alt_cii) / current_cii) * 100, 1)
                    })
            
            if alternative_fuels:
                recommendations.append({
                    'type': 'fuel_switching',
                    'title': 'Consider Alternative Fuels',
                    'description': 'Switching to cleaner fuels can significantly improve CII rating',
                    'impact': 'high',
                    'alternatives': alternative_fuels,
                    'suggestions': [
                        'Evaluate LNG conversion feasibility',
                        'Consider dual-fuel engines for new builds',
                        'Assess methanol availability at ports'
                    ]
                })
        
        return {
            'success': result.success,
            'currentRating': current_rating,
            'targetRating': target_rating,
            'achievedRating': optimized_rating,
            'currentCII': round(current_cii, 2),
            'targetCII': round(target_cii, 2),
            'optimizedCII': round(optimized_cii, 2),
            'requiredCII': round(required_cii, 2),
            'improvement': round(((current_cii - optimized_cii) / current_cii) * 100, 1),
            'recommendations': recommendations,
            'optimizedParams': {
                'annualFuelConsumption': round(optimized_fuel, 2),
                'distanceTraveled': round(optimized_distance, 2),
                'fuelType': current_params['fuelType']
            }
        }


def optimize_cii_endpoint(request_data: str) -> str:
    """
    API endpoint function for CII optimization
    
    Args:
        request_data: JSON string with optimization request
    
    Returns:
        JSON string with optimization results
    """
    try:
        data = json.loads(request_data)
        optimizer = MaritimeOptimizer()
        result = optimizer.optimize_cii(
            data['currentParams'],
            data['shipInfo'],
            data.get('targetRating')
        )
        return json.dumps(result)
    except Exception as e:
        return json.dumps({
            'success': False,
            'error': str(e)
        })


if __name__ == '__main__':
    # Test the optimizer
    test_params = {
        'annualFuelConsumption': 18500,
        'distanceTraveled': 95000,
        'fuelType': 'HFO'
    }
    
    test_ship = {
        'shipType': 'Bulk Carrier',
        'capacity': 85000,
        'year': 2025
    }
    
    optimizer = MaritimeOptimizer()
    result = optimizer.optimize_cii(test_params, test_ship)
    print(json.dumps(result, indent=2))
