import { Types } from 'mongoose';
import { ENV } from '../../config/environment';
import Transaction from '../../models/Transaction';
import { logger } from '../../utils/helpers/logger';

export interface FraudRiskScore {
  score: number; // 0-100, higher = more risky
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendations: string[];
}

export interface FraudRule {
  id: string;
  name: string;
  description: string;
  weight: number;
  enabled: boolean;
  condition: (transaction: any) => boolean;
}

export interface FraudDetectionResult {
  isFraudulent: boolean;
  riskScore: FraudRiskScore;
  flagged: boolean;
  reason?: string;
  action: 'allow' | 'block' | 'review' | 'flag';
}

export interface TransactionRisk {
  transactionId: string;
  riskScore: number;
  riskLevel: string;
  factors: string[];
  timestamp: Date;
}

/**
 * Fraud Detection Service
 * Handles fraud detection and risk assessment
 */
export class FraudDetectionService {
  private static readonly FRAUD_RULES: FraudRule[] = [
    {
      id: 'high_amount',
      name: 'High Transaction Amount',
      description: 'Transaction amount is unusually high',
      weight: 20,
      enabled: true,
      condition: (_transaction) => _transaction.amount > 1000000 // 1M NGN
    },
    {
      id: 'multiple_failed_attempts',
      name: 'Multiple Failed Attempts',
      description: 'Multiple failed payment attempts from same source',
      weight: 25,
      enabled: true,
      condition: (_transaction) => {
        // This would check recent failed attempts
        return false; // Simplified for demo
      }
    },
    {
      id: 'unusual_time',
      name: 'Unusual Transaction Time',
      description: 'Transaction at unusual hours',
      weight: 15,
      enabled: true,
      condition: (_transaction) => {
        const hour = new Date(_transaction.createdAt).getHours();
        return hour < 6 || hour > 23; // Outside 6 AM - 11 PM
      }
    },
    {
      id: 'new_customer_high_amount',
      name: 'New Customer High Amount',
      description: 'New customer with high transaction amount',
      weight: 30,
      enabled: true,
      condition: (_transaction) => {
        // This would check if customer is new and amount is high
        return _transaction.amount > 500000 && _transaction.isNewCustomer;
      }
    },
    {
      id: 'suspicious_ip',
      name: 'Suspicious IP Address',
      description: 'Transaction from suspicious IP address',
      weight: 20,
      enabled: true,
      condition: (_transaction) => {
        // This would check IP reputation
        return false; // Simplified for demo
      }
    },
    {
      id: 'velocity_check',
      name: 'High Velocity Transactions',
      description: 'Too many transactions in short time',
      weight: 25,
      enabled: true,
      condition: (_transaction) => {
        // This would check transaction velocity
        return false; // Simplified for demo
      }
    }
  ];

  /**
   * Analyze a transaction for fraud
   */
  static async analyzeTransaction(transaction: any): Promise<FraudDetectionResult> {
    try {
      const riskScore = await this.calculateRiskScore(transaction);
      const isFraudulent = riskScore.score >= ENV.FRAUD_BLOCK_THRESHOLD;
      const flagged = riskScore.score >= ENV.FRAUD_REVIEW_THRESHOLD;
      
      let action: 'allow' | 'block' | 'review' | 'flag' = 'allow';
      let reason: string | undefined = undefined;
      
      if (isFraudulent) {
        action = 'block';
        reason = 'High risk score detected';
      } else if (flagged) {
        action = 'review';
        reason = 'Suspicious activity detected';
      } else if (riskScore.score >= ENV.FRAUD_FLAG_THRESHOLD) {
        action = 'flag';
        reason = 'Moderate risk detected';
      }
      
      return {
        isFraudulent,
        riskScore,
        flagged,
        action,
        ...(reason && { reason })
      };
    } catch (error) {
      logger.error('Error analyzing transaction for fraud:', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Calculate risk score for a transaction
   */
  static async calculateRiskScore(transaction: any): Promise<FraudRiskScore> {
    try {
      let totalScore = 0;
      const factors: string[] = [];
      const recommendations: string[] = [];
      
      // Apply fraud rules
      for (const rule of this.FRAUD_RULES) {
        if (rule.enabled && rule.condition(transaction)) {
          totalScore += rule.weight;
          factors.push(rule.name);
        }
      }
      
      // Additional checks
      const velocityCheck = await this.checkVelocityFraud(
        transaction.customerEmail,
        transaction.merchantId
      );
      
      if (velocityCheck) {
        totalScore += 30;
        factors.push('High velocity transactions');
      }
      
      const amountAnomaly = await this.checkAmountAnomaly(
        transaction.merchantId,
        transaction.amount
      );
      
      if (amountAnomaly) {
        totalScore += 25;
        factors.push('Amount anomaly detected');
      }
      
      const geographicAnomaly = await this.checkGeographicAnomaly(
        transaction.customerEmail,
        transaction.ipAddress || 'unknown'
      );
      
      if (geographicAnomaly) {
        totalScore += 20;
        factors.push('Geographic anomaly');
      }
      
      // Determine risk level
      let level: 'low' | 'medium' | 'high' | 'critical';
      if (totalScore >= 80) {
        level = 'critical';
        recommendations.push('Block transaction immediately');
        recommendations.push('Flag customer for review');
      } else if (totalScore >= 60) {
        level = 'high';
        recommendations.push('Review transaction manually');
        recommendations.push('Request additional verification');
      } else if (totalScore >= 40) {
        level = 'medium';
        recommendations.push('Monitor transaction closely');
        recommendations.push('Consider additional verification');
      } else {
        level = 'low';
        recommendations.push('Proceed with normal processing');
      }
      
      return {
        score: Math.min(totalScore, 100),
        level,
        factors,
        recommendations
      };
    } catch (error) {
      logger.error('Error calculating risk score:', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Check for velocity fraud (too many transactions in short time)
   */
  static async checkVelocityFraud(
    customerEmail: string,
    merchantId: Types.ObjectId,
    timeWindow: number = 3600000 // 1 hour
  ): Promise<boolean> {
    try {
      // Use Mongo TTL doc to simulate Redis-like counter per window in sandbox
      const key = `vel:${merchantId.toString()}:${customerEmail}`;
      const { default: SandboxVelocity } = await import('../../models/SandboxVelocity');
      const now = Date.now();
      const existing = await SandboxVelocity.findOne({ key });
      if (!existing || (existing.expiresAt && existing.expiresAt.getTime() <= now)) {
        const expiresAt = new Date(now + timeWindow);
        await SandboxVelocity.findOneAndUpdate(
          { key },
          { key, count: 1, expiresAt },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return false;
      } else {
        existing.count += 1;
        await existing.save();
        return existing.count > 5;
      }

      const cutoffTime = new Date(Date.now() - timeWindow);
      
      const recentTransactions = await Transaction.find({
        customerEmail,
        merchantId,
        createdAt: { $gte: cutoffTime }
      }).countDocuments();
      
      return recentTransactions > 5; // fallback check
    } catch (error) {
      logger.error('Error checking velocity fraud:', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Check for amount anomalies
   */
  static async checkAmountAnomaly(
    merchantId: Types.ObjectId,
    amount: number,
    timeWindow: number = 86400000 // 24 hours
  ): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindow);
      
      // Get average transaction amount for this merchant
      const stats = await Transaction.aggregate([
        {
          $match: {
            merchantId,
            status: 'success',
            createdAt: { $gte: cutoffTime }
          }
        },
        {
          $group: {
            _id: null,
            avgAmount: { $avg: '$amount' },
            maxAmount: { $max: '$amount' }
          }
        }
      ]);
      
      if (stats.length === 0) return false;
      
      const avgAmount = stats[0].avgAmount;
      const maxAmount = stats[0].maxAmount;
      
      // Check if current amount is significantly higher than average
      return amount > avgAmount * 3 || amount > maxAmount * 1.5;
    } catch (error) {
      logger.error('Error checking amount anomaly:', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Check for geographic anomalies
   */
  static async checkGeographicAnomaly(
    customerEmail: string,
    transactionLocation: string,
    timeWindow: number = 86400000 // 24 hours
  ): Promise<boolean> {
    try {
      const cutoffTime = new Date(Date.now() - timeWindow);
      
      // Get recent transactions for this customer
      const recentTransactions = await Transaction.find({
        customerEmail,
        createdAt: { $gte: cutoffTime }
      }).select('ipAddress');
      
      if (recentTransactions.length === 0) return false;
      
      // Check if location is different from recent transactions
      const uniqueLocations = new Set(
        recentTransactions
          .map((t: any) => t.ipAddress)
          .filter(Boolean)
      );
      
      return uniqueLocations.size > 2; // Customer from more than 2 different locations
    } catch (error) {
      logger.error('Error checking geographic anomaly:', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Get fraud statistics for a merchant
   */
  static async getFraudStatistics(
    merchantId: Types.ObjectId,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalTransactions: number;
    flaggedTransactions: number;
    blockedTransactions: number;
    fraudRate: number;
    averageRiskScore: number;
    topRiskFactors: Array<{ factor: string; count: number }>;
  }> {
    try {
      const match: any = { merchantId };
      
      if (startDate && endDate) {
        match.createdAt = { $gte: startDate, $lte: endDate };
      }
      
      const transactions = await Transaction.find(match);
      
      let flaggedCount = 0;
      let blockedCount = 0;
      let totalRiskScore = 0;
      const riskFactors: Record<string, number> = {};
      
      for (const transaction of transactions) {
        const analysis = await this.analyzeTransaction(transaction);
        
        if (analysis.flagged) flaggedCount++;
        if (analysis.action === 'block') blockedCount++;
        
        totalRiskScore += analysis.riskScore.score;
        
        // Count risk factors
        analysis.riskScore.factors.forEach((factor: string) => {
          riskFactors[factor] = (riskFactors[factor] || 0) + 1;
        });
      }
      
      const totalTransactions = transactions.length;
      const fraudRate = totalTransactions > 0 ? (flaggedCount / totalTransactions) * 100 : 0;
      const averageRiskScore = totalTransactions > 0 ? totalRiskScore / totalTransactions : 0;
      
      // Get top risk factors
      const topRiskFactors = Object.entries(riskFactors)
        .map(([factor, count]) => ({ factor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      return {
        totalTransactions,
        flaggedTransactions: flaggedCount,
        blockedTransactions: blockedCount,
        fraudRate,
        averageRiskScore,
        topRiskFactors
      };
    } catch (error) {
      logger.error('Error getting fraud statistics:', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  /**
   * Update a fraud rule
   */
  static updateFraudRule(ruleId: string, updates: Partial<FraudRule>): boolean {
    try {
      const ruleIndex = this.FRAUD_RULES.findIndex(rule => rule.id === ruleId);
      
      if (ruleIndex === -1) {
        return false;
      }
      
      this.FRAUD_RULES[ruleIndex] = {
        ...this.FRAUD_RULES[ruleIndex],
        ...updates
      };
      
      logger.info('Fraud rule updated:', { ruleId, updates });
      return true;
    } catch (error) {
      logger.error('Error updating fraud rule:', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Add a new fraud rule
   */
  static addFraudRule(rule: {
    id?: string;
    name: string;
    description: string;
    weight: number;
    enabled: boolean;
    condition: (transaction: any) => boolean;
  }): boolean {
    try {
      const newRule: FraudRule = {
        id: rule.id || `rule_${Date.now()}`,
        name: rule.name,
        description: rule.description,
        weight: rule.weight,
        enabled: rule.enabled,
        condition: rule.condition
      };
      
      this.FRAUD_RULES.push(newRule);
      
      logger.info('Fraud rule added:', { ruleId: newRule.id, name: newRule.name });
      return true;
    } catch (error) {
      logger.error('Error adding fraud rule:', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Remove a fraud rule
   */
  static removeFraudRule(ruleId: string): boolean {
    try {
      const ruleIndex = this.FRAUD_RULES.findIndex(rule => rule.id === ruleId);
      
      if (ruleIndex === -1) {
        return false;
      }
      
      const removedRule = this.FRAUD_RULES.splice(ruleIndex, 1)[0];
      
      if (removedRule) {
        logger.info('Fraud rule removed:', { ruleId, name: removedRule.name });
      }
      
      return true;
    } catch (error) {
      logger.error('Error removing fraud rule:', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Get all fraud rules
   */
  static getFraudRules(): FraudRule[] {
    return [...this.FRAUD_RULES];
  }

  /**
   * Toggle a fraud rule
   */
  static toggleFraudRule(ruleId: string, enabled: boolean): boolean {
    return this.updateFraudRule(ruleId, { enabled });
  }
} 