import { asyncHandler } from '../../lib/asyncHandler.js';
import * as service from './agents.service.js';

export const list = asyncHandler(async (req, res) => {
  res.json(await service.listAgents(req.query));
});

export const getMe = asyncHandler(async (req, res) => {
  res.json({ agent: await service.getMyProfile(req.user) });
});

export const updateMe = asyncHandler(async (req, res) => {
  res.json({ agent: await service.updateMyProfile(req.user, req.body) });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ agent: await service.getAgent(req.params.id) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ agent: await service.updateAgent(req, req.params.id, req.body) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ agent: await service.createAgent(req, req.body) });
});

export const getPublic = asyncHandler(async (req, res) => {
  res.json(await service.getPublicProfile(req.params.id, req.query));
});
