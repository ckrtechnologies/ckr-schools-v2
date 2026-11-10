import * as repo from './repository.js';
import {
  updateSettingsSchema,
  addSpotlightSchema,
  addThoughtSchema,
  addChampionSchema,
  addGallerySchema,
  addNewsletterSchema
} from './validation.js';

// Settings
export async function getSettings(tenantId) {
  const settings = await repo.getSchoolSettings(tenantId);
  return settings || {
    instagram_url: null,
    whatsapp_url: null,
    linkedin_url: null,
    twitter_url: null,
    facebook_url: null,
    youtube_url: null,
    website_url: null,
    late_fee_penalty: 10
  };
}

export async function saveSettings(tenantId, rawData) {
  const validated = updateSettingsSchema.parse(rawData);
  return await repo.upsertSchoolSettings(tenantId, validated);
}

// Spotlight & Thought
export async function getSpotlight(tenantId, date) {
  if (date) {
    return await repo.getSpotlight(tenantId, date);
  }
  return await repo.listSpotlights(tenantId);
}

export async function addSpotlight(tenantId, rawData) {
  return await repo.createSpotlight(tenantId, rawData);
}

export async function editSpotlight(tenantId, id, rawData) {
  return await repo.updateSpotlight(tenantId, id, rawData);
}

export async function removeSpotlight(tenantId, id) {
  return await repo.deleteSpotlight(tenantId, id);
}

export async function getThought(tenantId, date) {
  if (date) {
    return await repo.getThought(tenantId, date);
  }
  return await repo.listThoughts(tenantId);
}

export async function addThought(tenantId, rawData) {
  return await repo.createThought(tenantId, rawData);
}

export async function editThought(tenantId, id, rawData) {
  return await repo.updateThought(tenantId, id, rawData);
}

export async function removeThought(tenantId, id) {
  return await repo.deleteThought(tenantId, id);
}

// Champions, Gallery & Newsletters
export async function getChampions(tenantId) {
  return await repo.listChampions(tenantId);
}

export async function addChampion(tenantId, rawData) {
  const validated = addChampionSchema.parse(rawData);
  return await repo.createChampion(tenantId, validated);
}

export async function removeChampion(tenantId, championId) {
  return await repo.deleteChampion(tenantId, championId);
}

export async function getGallery(tenantId) {
  return await repo.listGallery(tenantId);
}

export async function addGallery(tenantId, rawData) {
  const validated = addGallerySchema.parse(rawData);
  return await repo.createGalleryImage(tenantId, validated);
}

export async function removeGallery(tenantId, imageId) {
  return await repo.deleteGalleryImage(tenantId, imageId);
}

export async function getNewsletters(tenantId) {
  return await repo.listNewsletters(tenantId);
}

export async function addNewsletter(tenantId, rawData) {
  const validated = addNewsletterSchema.parse(rawData);
  return await repo.createNewsletter(tenantId, validated);
}

export async function removeNewsletter(tenantId, id) {
  return await repo.deleteNewsletter(tenantId, id);
}

export async function getSchoolProfile(tenantId) {
  return await repo.getTenantProfile(tenantId);
}

export async function updateSchoolProfile(tenantId, data) {
  return await repo.updateTenantProfile(tenantId, data);
}

export async function getAllInfo(tenantId) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  const [profile, settings, spotlight, thought, champions, gallery, newsletters] = await Promise.all([
    getSchoolProfile(tenantId),
    getSettings(tenantId),
    getSpotlight(tenantId, today),
    getThought(tenantId, today),
    getChampions(tenantId),
    getGallery(tenantId),
    getNewsletters(tenantId)
  ]);

  return { profile, settings, spotlight, thought, champions, gallery, newsletters };
}

