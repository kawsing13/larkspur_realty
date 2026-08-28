-- DropIndex
DROP INDEX "Inquiry_status_idx";

-- CreateIndex
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");

-- CreateIndex
CREATE INDEX "Appointment_inquiryId_idx" ON "Appointment"("inquiryId");

-- CreateIndex
CREATE INDEX "Inquiry_status_createdAt_idx" ON "Inquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Inquiry_customerId_idx" ON "Inquiry"("customerId");

-- CreateIndex
CREATE INDEX "Property_createdById_idx" ON "Property"("createdById");
