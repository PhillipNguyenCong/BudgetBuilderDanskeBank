import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AllocationError } from '@budget-builder/budget-core';
import { AppError } from './errors.js';
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const requestId = String(response.locals.requestId);
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed.',
        requestId,
        fields: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }
  if (error instanceof AllocationError) {
    response.status(422).json({
      error: {
        code: error.code,
        message:
          error.code === 'OVER_ALLOCATED'
            ? 'Allocations exceed income.'
            : 'Total amount exceeds the supported range.',
        requestId,
      },
    });
    return;
  }
  if (error instanceof AppError) {
    response
      .status(error.status)
      .json({ error: { code: error.code, message: error.message, requestId } });
    return;
  }
  if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
    response.status(error.type === 'entity.too.large' ? 413 : 400).json({
      error: { code: 'INVALID_BODY', message: 'Invalid or oversized JSON body.', requestId },
    });
    return;
  }
  response.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed.', requestId },
  });
};
