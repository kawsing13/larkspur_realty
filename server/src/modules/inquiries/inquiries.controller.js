import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './inquiries.service.js';

export const create = asyncHandler(async (req, res) => {
  const result = await service.createInquiry(req.body, req.user);
  res.status(201).json(result);
});

export const listMine = asyncHandler(async (req, res) => {
  res.json({ data: await service.listForCustomer(req.user) });
});

export const list = asyncHandler(async (req, res) => {
  res.json(await service.listForStaff(req.user, req.query));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ inquiry: await service.getForStaff(req.user, req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ inquiry: await service.updateInquiry(req.user, req.params.id, req.body) });
});

export const addNote = asyncHandler(async (req, res) => {
  res.json({ inquiry: await service.addNote(req.user, req.params.id, req.body.body) });
});

export const assign = asyncHandler(async (req, res) => {
  const inquiry = await service.assignInquiry(req, req.params.id, req.body.agentId, req.body.reason);
  res.json({ inquiry });
});
