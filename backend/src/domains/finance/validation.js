import { z } from 'zod';

export const createFeeHeadSchema = z.object({
  title: z.string().min(1, 'Fee title is required'),
  amount: z.preprocess(val => Number(val || 0), z.number().nonnegative().default(0)),
  due_date: z.preprocess(val => val || null, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  fee_type: z.preprocess(
    val => {
      if (!val) return 'Monthly';
      const map = {
        'monthly': 'Monthly',
        'quarterly': 'Quarterly',
        'annual': 'Annual',
        'one-time': 'One-Time',
        'one time': 'One-Time',
        'onetime': 'One-Time'
      };
      return map[String(val).toLowerCase()] || String(val);
    },
    z.enum(['Monthly', 'Quarterly', 'Annual', 'One-Time']).default('Monthly')
  )
});

export const collectFeeSchema = z.object({
  student_id: z.string().uuid('Student ID is required'),
  total_amount: z.preprocess(val => Number(val || 0), z.number().nonnegative()),
  payment_mode: z.preprocess(
    val => typeof val === 'string' ? val.toUpperCase() : (val || 'CASH'),
    z.enum(['CASH', 'CHEQUE', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER']).default('CASH')
  ),
  remarks: z.preprocess(val => val || null, z.string().nullable().optional()),
  allocations: z.array(z.object({
    fee_id: z.preprocess(val => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'string' && val.startsWith('physical-')) {
        val = val.replace('physical-', '');
      }
      const num = Number(val);
      return (!val || isNaN(num)) ? null : Math.round(num);
    }, z.number().int().nullable().optional()),
    amount_paid: z.preprocess(val => Number(val || 0), z.number().nonnegative()),
    remarks: z.preprocess(val => val || null, z.string().nullable().optional()),
    title: z.preprocess(val => val || null, z.string().nullable().optional())
  })).optional().default([])
});

export const transactionSchema = z.object({
  type: z.preprocess(
    val => typeof val === 'string' ? val.toUpperCase() : val,
    z.enum(['INCOME', 'EXPENSE', 'Income', 'Expense'])
  ),
  category_id: z.preprocess(val => {
    if (val === '' || val === null || val === undefined || val === 'null' || val === 'none') return null;
    const n = Number(val);
    return isNaN(n) ? null : Math.round(n);
  }, z.number().int().nullable().optional()),
  amount: z.preprocess(val => Number(val || 0), z.number().nonnegative('Amount must be non-negative')),
  transaction_date: z.preprocess(
    val => (val ? String(val).split('T')[0] : new Date().toISOString().split('T')[0]),
    z.string().optional()
  ),
  description: z.string().min(1, 'Description is required'),
  payment_method: z.preprocess(val => val || 'Cash', z.string().default('Cash')),
  reference_number: z.preprocess(val => (val ? String(val) : null), z.string().nullable().optional())
});


