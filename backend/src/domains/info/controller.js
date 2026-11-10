import * as service from './service.js';

export async function getPublicSchoolProfileHandler(req, res, next) {
  try {
    const { pgPool } = await import('../../config/db.js');
    let tenant = req.tenant;

    const requestedSlug = req.query?.slug || req.query?.school || req.query?.tenant || req.headers['x-tenant-slug'];

    if (!tenant && requestedSlug) {
      const { rows } = await pgPool.query(
        'SELECT * FROM public.tenants WHERE slug = $1 AND is_active = TRUE LIMIT 1',
        [String(requestedSlug).toLowerCase().trim()]
      );
      tenant = rows[0];
      if (!tenant) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: `School campus '${requestedSlug}' not found or inactive.`
          }
        });
      }
    }

    // If still no tenant specified (e.g. root localhost), fall back to the first active school in PostgreSQL
    if (!tenant) {
      const { rows } = await pgPool.query(
        'SELECT * FROM public.tenants WHERE is_active = TRUE ORDER BY created_at ASC LIMIT 1'
      );
      tenant = rows[0];
    }

    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: requestedSlug ? `School campus '${requestedSlug}' not found.` : 'No school campuses found on the platform.'
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        motto: tenant.motto || '',
        trustName: tenant.motto || (tenant.slug === 'vision' ? "Pokharana Educational Trust's" : ''),
        logoUrl: tenant.logo_url || null,
        themeColor: tenant.theme_color || '#064e3b',
        accentColor: tenant.accent_color || '#10b981',
        affiliationBoard: tenant.affiliation_board || 'CBSE',
        boardAffiliationNumber: tenant.board_affiliation_number || '',
        schoolCode: tenant.school_code || '',
        officialEmail: tenant.official_email || '',
        officialPhone: tenant.official_phone || '',
        website: tenant.website || '',
        address: tenant.address || '',
        city: tenant.city || '',
        state: tenant.state || '',
        pincode: tenant.pincode || '',
        // snake_case aliases for broad compatibility
        logo_url: tenant.logo_url || null,
        theme_color: tenant.theme_color || '#064e3b',
        accent_color: tenant.accent_color || '#10b981',
        affiliation_board: tenant.affiliation_board || 'CBSE',
        board_affiliation_number: tenant.board_affiliation_number || '',
        school_code: tenant.school_code || '',
        official_email: tenant.official_email || '',
        official_phone: tenant.official_phone || ''
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getPublicSchoolsListHandler(req, res, next) {
  try {
    const { pgPool } = await import('../../config/db.js');
    const { rows } = await pgPool.query(
      `SELECT id, slug, name, logo_url, motto, city, state, theme_color, accent_color, affiliation_board
       FROM public.tenants
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );
    return res.status(200).json({
      success: true,
      data: rows.map(r => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        logoUrl: r.logo_url,
        motto: r.motto,
        city: r.city,
        state: r.state,
        themeColor: r.theme_color || '#064e3b',
        accentColor: r.accent_color || '#10b981',
        affiliationBoard: r.affiliation_board,
      }))
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllInfoHandler(req, res, next) {
  try {
    const data = await service.getAllInfo(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getSettingsHandler(req, res, next) {
  try {
    const data = await service.getSettings(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateSettingsHandler(req, res, next) {
  try {
    const data = await service.saveSettings(req.tenant.id, req.body);
    return res.status(200).json({ success: true, message: 'Settings updated', data });
  } catch (err) {
    next(err);
  }
}

export async function getSchoolProfileHandler(req, res, next) {
  try {
    const data = await service.getSchoolProfile(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateSchoolProfileHandler(req, res, next) {
  try {
    const data = await service.updateSchoolProfile(req.tenant.id, req.body);
    return res.status(200).json({ success: true, message: 'School profile updated successfully', data });
  } catch (err) {
    next(err);
  }
}

// Spotlight & Thought
export async function getSpotlightHandler(req, res, next) {
  try {
    const isToday = req.path.includes('/today');
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const date = isToday ? (req.query?.date || todayIST) : req.query?.date;
    const data = await service.getSpotlight(req.tenant.id, date);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createSpotlightHandler(req, res, next) {
  try {
    const data = await service.addSpotlight(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Spotlight posted', data });
  } catch (err) {
    next(err);
  }
}

export async function updateSpotlightHandler(req, res, next) {
  try {
    const data = await service.editSpotlight(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Spotlight updated', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteSpotlightHandler(req, res, next) {
  try {
    await service.removeSpotlight(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, message: 'Spotlight deleted' });
  } catch (err) {
    next(err);
  }
}

export async function getThoughtHandler(req, res, next) {
  try {
    const isToday = req.path.includes('/today');
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const date = isToday ? (req.query?.date || todayIST) : req.query?.date;
    const data = await service.getThought(req.tenant.id, date);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createThoughtHandler(req, res, next) {
  try {
    const data = await service.addThought(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Thought of day posted', data });
  } catch (err) {
    next(err);
  }
}

export async function updateThoughtHandler(req, res, next) {
  try {
    const data = await service.editThought(req.tenant.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: 'Thought updated', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteThoughtHandler(req, res, next) {
  try {
    await service.removeThought(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, message: 'Thought deleted' });
  } catch (err) {
    next(err);
  }
}

// Champions, Gallery, Newsletters
export async function getChampionsHandler(req, res, next) {
  try {
    const data = await service.getChampions(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function addChampionHandler(req, res, next) {
  try {
    const data = await service.addChampion(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Champion recorded', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteChampionHandler(req, res, next) {
  try {
    const result = await service.removeChampion(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    next(err);
  }
}

export async function getGalleryHandler(req, res, next) {
  try {
    const data = await service.getGallery(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function addGalleryHandler(req, res, next) {
  try {
    const data = await service.addGallery(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Gallery item uploaded', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteGalleryHandler(req, res, next) {
  try {
    const result = await service.removeGallery(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    next(err);
  }
}

export async function getNewslettersHandler(req, res, next) {
  try {
    const data = await service.getNewsletters(req.tenant.id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function addNewsletterHandler(req, res, next) {
  try {
    const data = await service.addNewsletter(req.tenant.id, req.body);
    return res.status(201).json({ success: true, message: 'Newsletter published', data });
  } catch (err) {
    next(err);
  }
}

export async function deleteNewsletterHandler(req, res, next) {
  try {
    const result = await service.removeNewsletter(req.tenant.id, req.params.id);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    next(err);
  }
}

