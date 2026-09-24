import { sendSuccess } from '../utils/response.js';
import { query } from '../config/db.js';

export const getTrainingData = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    let training = { program: null, enrollment: null, mentor: null };
    try {
      const rows = await query(
        `SELECT
           tp.id AS program_id, tp.name AS program_name, tp.code AS program_code, tp.short_name,
           tp.placement_season_year, tp.graduation_year, tp.description, tp.fee_amount AS program_fee, tp.status AS program_status,
           te.id AS enrollment_id, te.training_option, te.fee_amount, te.amount_paid, te.payment_status,
           te.payment_proof_url, te.payment_received_by, te.whatsapp_group_added, te.source_status, te.source_timestamp,
           te.batch_id, b.name AS batch_name,
           mu.name AS mentor_name, mu.mobile_number AS mentor_mobile
         FROM training_enrollments te
         JOIN training_programs tp ON tp.id = te.program_id
         LEFT JOIN batches b ON b.id = te.batch_id
         LEFT JOIN mentor_student_assignments msa ON msa.student_id = te.student_user_id
         LEFT JOIN users mu ON mu.id = msa.mentor_id
         WHERE te.student_user_id = ?
         ORDER BY te.id DESC
         LIMIT 1`,
        [userId]
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        training = {
          program: {
            id: r.program_id,
            name: r.program_name,
            code: r.program_code,
            shortName: r.short_name || r.program_code,
            placementSeasonYear: r.placement_season_year,
            graduationYear: r.graduation_year,
            description: r.description,
            feeAmount: r.program_fee,
            status: r.program_status,
          },
          enrollment: {
            id: r.enrollment_id,
            trainingOption: r.training_option,
            feeAmount: r.fee_amount,
            amountPaid: r.amount_paid,
            paymentStatus: r.payment_status,
            paymentProofUrl: r.payment_proof_url,
            paymentReceivedBy: r.payment_received_by,
            whatsappGroupAdded: r.whatsapp_group_added,
            sourceStatus: r.source_status,
            sourceTimestamp: r.source_timestamp,
            batchId: r.batch_id,
            batchName: r.batch_name,
          },
          mentor: r.mentor_name ? { name: r.mentor_name, mobile: r.mentor_mobile } : null,
        };
      }
    } catch (e) {
      console.warn('[getTrainingData DB error]', e.message);
    }
    return sendSuccess(res, 'training data retrieved successfully', training);
  } catch (error) {
    next(error);
  }
};