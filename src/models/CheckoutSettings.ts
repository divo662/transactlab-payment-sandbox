import mongoose, { Schema, Document, Model } from 'mongoose';

export interface CheckoutThemeConfig {
  brandColor: string;
  accentColor: string;
  backgroundStyle: 'solid' | 'gradient' | 'image';
  coverImageUrl?: string;
}

export interface CheckoutBrandConfig {
  logoUrl?: string;
  companyName?: string;
  supportEmail?: string;
  supportUrl?: string;
}

export interface CheckoutLayoutConfig {
  showItemized: boolean;
  showTrustBadges: boolean;
  showSupportBox: boolean;
  showLegal: boolean;
}

export interface CheckoutLegalConfig {
  termsUrl?: string;
  privacyUrl?: string;
}

export interface ProductOverrideConfig {
  productId: string;
  product?: { displayName?: string; subtitle?: string };
  theme?: Partial<CheckoutThemeConfig>;
  brand?: Partial<CheckoutBrandConfig>;
  layout?: Partial<CheckoutLayoutConfig>;
  legal?: Partial<CheckoutLegalConfig>;
}

export interface ICheckoutSettings extends Document {
  ownerId: mongoose.Types.ObjectId; // workspace/user
  activeTemplateId: 'classic' | 'modern' | 'minimal';
  theme: CheckoutThemeConfig;
  brand: CheckoutBrandConfig;
  layout: CheckoutLayoutConfig;
  legal: CheckoutLegalConfig;
  productOverrides: ProductOverrideConfig[];
  sdkDefaults?: {
    paymentMode?: 'one_time' | 'subscription';
    amount?: number; // major units
    currency?: string;
    planId?: string;
    productName?: string;
    interval?: string; // day|week|month|quarter|year
  };
  createdAt: Date;
  updatedAt: Date;
}

const ThemeSchema = new Schema<CheckoutThemeConfig>({
  brandColor: { type: String, default: '#0a164d' },
  accentColor: { type: String, default: '#22c55e' },
  backgroundStyle: { type: String, enum: ['solid','gradient','image'], default: 'solid' },
  coverImageUrl: { type: String }
}, { _id: false });

const BrandSchema = new Schema<CheckoutBrandConfig>({
  logoUrl: { type: String },
  companyName: { type: String },
  supportEmail: { type: String },
  supportUrl: { type: String }
}, { _id: false });

const LayoutSchema = new Schema<CheckoutLayoutConfig>({
  showItemized: { type: Boolean, default: true },
  showTrustBadges: { type: Boolean, default: true },
  showSupportBox: { type: Boolean, default: true },
  showLegal: { type: Boolean, default: true }
}, { _id: false });

const LegalSchema = new Schema<CheckoutLegalConfig>({
  termsUrl: { type: String },
  privacyUrl: { type: String }
}, { _id: false });

const ProductOverrideSchema = new Schema<ProductOverrideConfig>({
  productId: { type: String, required: true },
  product: { displayName: String, subtitle: String },
  theme: { type: ThemeSchema, default: undefined },
  brand: { type: BrandSchema, default: undefined },
  layout: { type: LayoutSchema, default: undefined },
  legal: { type: LegalSchema, default: undefined }
}, { _id: false });

const CheckoutSettingsSchema = new Schema<ICheckoutSettings>({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  activeTemplateId: { type: String, enum: ['classic','modern','minimal'], default: 'classic' },
  theme: { type: ThemeSchema, default: () => ({}) },
  brand: { type: BrandSchema, default: () => ({}) },
  layout: { type: LayoutSchema, default: () => ({}) },
  legal: { type: LegalSchema, default: () => ({}) },
  productOverrides: { type: [ProductOverrideSchema], default: [] },
  sdkDefaults: { type: new Schema({
    paymentMode: { type: String, enum: ['one_time','subscription'], default: 'one_time' },
    amount: { type: Number },
    currency: { type: String, default: 'NGN' },
    planId: { type: String },
    productName: { type: String },
    interval: { type: String, default: 'month' }
  }, { _id: false }), default: undefined }
}, { timestamps: true });

export const CheckoutSettings: Model<ICheckoutSettings> = mongoose.model<ICheckoutSettings>('CheckoutSettings', CheckoutSettingsSchema);

export default CheckoutSettings;

