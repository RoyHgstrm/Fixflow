import { PlanType } from './types';

export const PLAN_CONFIGS = {
  [PlanType.SOLO]: {
    name: 'Solo Plan',
    description: 'Perfect for individual entrepreneurs',
    price: 29,
    features: [
      'Single User',
      'Basic Reporting',
      'Email Support',
      'Limited Work Orders'
    ],
    isPopular: false
  },
  [PlanType.TEAM]: {
    name: 'Team Plan',
    description: 'Ideal for small teams',
    price: 99,
    features: [
      'Multiple Users',
      'Advanced Reporting',
      'Priority Support',
      'Unlimited Work Orders'
    ],
    isPopular: true
  },
  [PlanType.BUSINESS]: {
    name: 'Business Plan',
    description: 'Scalable solution for growing businesses',
    price: 249,
    features: [
      'Unlimited Users',
      'Advanced Analytics',
      'Dedicated Support',
      'Custom Integrations'
    ],
    isPopular: false
  },
  [PlanType.ENTERPRISE]: {
    name: 'Enterprise Plan',
    description: 'Comprehensive solution for large organizations',
    price: 0, // Custom pricing
    features: [
      'Unlimited Everything',
      'Dedicated Account Manager',
      '24/7 Premium Support',
      'Custom Development'
    ],
    isPopular: false
  }
}; 