import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './appointments.service.js';

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(await service.createAppointment(req.body, req.user));
});

export const listMine = asyncHandler(async (req, res) => {
  res.json({ data: await service.listForCustomer(req.user) });
});

export const list = asyncHandler(async (req, res) => {
  res.json(await service.listForStaff(req.user, req.query));
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ appointment: await service.getForActor(req.user, req.params.id) });
});

export const transition = asyncHandler(async (req, res) => {
  const appointment = await service.runTransition(req, req.params.id, req.params.action, req.body);
  res.json({ appointment });
});
