import * as service from './service.js';

// Inquiries
export async function getEnquiriesHandler(req, res, next) {
  try {
    const data = await service.getEnquiries(req.tenant.id, req.query);
    return res.status(200).json({
      success: true,
      count: data.length,
      newUsers: data,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEnquiryByIdHandler(req, res, next) {
  try {
    const data = await service.getEnquiry(req.tenant.id, req.params.id);
    return res.status(200).json({
      success: true,
      newUser: data,
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function createEnquiryHandler(req, res, next) {
  try {
    const data = await service.addEnquiry(req.tenant.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Enquiry recorded',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEnquiryHandler(req, res, next) {
  try {
    const data = await service.editEnquiry(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Enquiry updated successfully',
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEnquiryHandler(req, res, next) {
  try {
    const result = await service.removeEnquiry(req.tenant.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateEnquiryStatusHandler(req, res, next) {
  try {
    const data = await service.editEnquiryStatus(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Enquiry status updated', data });
  } catch (err) {
    next(err);
  }
}

export async function enrollStudentHandler(req, res, next) {
  try {
    const student = await service.enrollStudent(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Student admitted and enrolled into class successfully',
      data: student
    });
  } catch (err) {
    next(err);
  }
}

export async function approveNewUserHandler(req, res, next) {
  try {
    const bodyData = req.body?.data || req.body;
    const enquiryId = bodyData.enquiryId || bodyData.enquiry_id || bodyData.id;
    const payload = bodyData.payload || bodyData;
    const status = bodyData.status || payload.status || 'Approved';

    if (String(status).toLowerCase() === 'rejected') {
      const updated = await service.editEnquiryStatus(req.tenant.id, enquiryId, { status: 'Rejected' });
      return res.status(200).json({
        success: true,
        message: 'Application rejected successfully',
        data: updated,
      });
    }

    const normalizedPayload = {
      admission_number: payload.admission_number || payload.admissionNumber || `ADM-${Date.now().toString().slice(-4)}`,
      admission_date: payload.admission_date || payload.admissionDate || new Date().toISOString().split('T')[0],
      class_id: payload.class_id || payload.classId,
      monthly_fee: Number(payload.monthly_fee ?? payload.monthlyFee ?? 0),
      bus_fee: Number(payload.bus_fee ?? payload.busFee ?? 0),
      house: payload.house || 'Yellow'
    };

    const student = await service.enrollStudent(req.tenant.id, enquiryId, normalizedPayload);
    return res.status(200).json({
      success: true,
      message: 'User approved and enrolled successfully',
      student,
      data: student,
    });
  } catch (err) {
    next(err);
  }
}

// Transfer Certificates
export async function getTransferCertificatesHandler(req, res, next) {
  try {
    const data = await service.getTransferCertificates(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getTcDetailsHandler(req, res, next) {
  try {
    const tcNumber = req.params.tcNumber;
    const data = await service.getTcDetails(req.tenant.id, tcNumber);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function issueTcHandler(req, res, next) {
  try {
    const data = await service.issueTransferCertificate(req.tenant.id, req.user.sub, req.body);
    return res.status(201).json({ success: true, message: 'Transfer certificate generated', data });
  } catch (err) {
    next(err);
  }
}

