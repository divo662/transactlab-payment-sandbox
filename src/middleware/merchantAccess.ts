import { Request, Response, NextFunction } from 'express';
import Merchant from '../models/Merchant';
import { ResponseHelper } from '../utils/helpers/responseHelper';
import { Types } from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user: {
    _id: any;
    email: string;
    role: string;
  };
}

export const validateMerchantAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { merchantId } = req.params;
    
    if (!merchantId) {
      return ResponseHelper.badRequest(res, 'Merchant ID is required');
    }

    // Check if user is admin (admin can access all merchants)
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if merchant exists and user has access
    const merchant = await Merchant.findOne({
      _id: merchantId,
      userId: req.user._id
    });

    if (!merchant) {
      return ResponseHelper.forbidden(res, 'Access denied: Merchant not found or access not granted');
    }

    // Add merchant info to request for use in controllers
    req.merchant = {
      _id: merchant._id as Types.ObjectId,
      businessName: merchant.businessName,
      businessEmail: merchant.businessEmail,
      isActive: merchant.isActive
    };
    next();
  } catch (error) {
    return ResponseHelper.internalServerError(res, 'Error validating merchant access', error.message);
  }
};

export const validateMerchantOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { merchantId } = req.params;
    
    if (!merchantId) {
      return ResponseHelper.badRequest(res, 'Merchant ID is required');
    }

    // Check if user is admin (admin can access all merchants)
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if merchant exists and user owns it
    const merchant = await Merchant.findOne({
      _id: merchantId,
      userId: req.user._id
    });

    if (!merchant) {
      return ResponseHelper.forbidden(res, 'Access denied: Merchant not found or you do not own it');
    }

    // Add merchant info to request for use in controllers
    req.merchant = {
      _id: merchant._id as Types.ObjectId,
      businessName: merchant.businessName,
      businessEmail: merchant.businessEmail,
      isActive: merchant.isActive
    };
    next();
  } catch (error) {
    return ResponseHelper.internalServerError(res, 'Error validating merchant ownership', error.message);
  }
};

export const validateMerchantProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { merchantId } = req.params;
    
    if (!merchantId) {
      return ResponseHelper.badRequest(res, 'Merchant ID is required');
    }

    // Check if user is admin (admin can access all merchants)
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if merchant exists and user has access
    const merchant = await Merchant.findOne({
      _id: merchantId,
      userId: req.user._id
    });

    if (!merchant) {
      return ResponseHelper.forbidden(res, 'Access denied: Merchant not found or access not granted');
    }

    // Check if merchant profile is complete using type assertion for virtual property
    const merchantDoc = merchant as any;
    if (!merchantDoc.isProfileComplete) {
      return ResponseHelper.badRequest(res, 'Merchant profile must be complete before accessing payment features');
    }

    // Add merchant info to request for use in controllers
    req.merchant = {
      _id: merchant._id as Types.ObjectId,
      businessName: merchant.businessName,
      businessEmail: merchant.businessEmail,
      isActive: merchant.isActive
    };
    next();
  } catch (error) {
    return ResponseHelper.internalServerError(res, 'Error validating merchant profile', error.message);
  }
};
