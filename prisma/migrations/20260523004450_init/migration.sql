-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'SALES', 'MANAGER');

-- CreateEnum
CREATE TYPE "public"."RuleType" AS ENUM ('REQUIRES', 'EXCLUDES', 'ALLOW_ONLY');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "public"."QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'SALES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "basePrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "categoryId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StandardSpec" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StandardSpec_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OptionGroup" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isMultiSelect" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OptionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OptionValue" (
    "id" SERIAL NOT NULL,
    "optionGroupId" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "priceDelta" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DependencyRule" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "ruleType" "public"."RuleType" NOT NULL,
    "sourceOptionValueId" INTEGER NOT NULL,
    "targetOptionGroupId" INTEGER NOT NULL,
    "targetOptionValueId" INTEGER,

    CONSTRAINT "DependencyRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Quote" (
    "id" SERIAL NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "numberOfUnits" INTEGER NOT NULL DEFAULT 1,
    "status" "public"."QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "quotationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuoteItem" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "optionGroupId" INTEGER NOT NULL,
    "optionValueId" INTEGER NOT NULL,
    "priceDelta" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuoteDiscount" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."DiscountType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "QuoteDiscount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."QuoteHistory" (
    "id" SERIAL NOT NULL,
    "quoteId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedById" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "public"."ProductCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "public"."Quote"("quoteNumber");

-- AddForeignKey
ALTER TABLE "public"."ProductCategory" ADD CONSTRAINT "ProductCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StandardSpec" ADD CONSTRAINT "StandardSpec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptionGroup" ADD CONSTRAINT "OptionGroup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OptionValue" ADD CONSTRAINT "OptionValue_optionGroupId_fkey" FOREIGN KEY ("optionGroupId") REFERENCES "public"."OptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DependencyRule" ADD CONSTRAINT "DependencyRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DependencyRule" ADD CONSTRAINT "DependencyRule_sourceOptionValueId_fkey" FOREIGN KEY ("sourceOptionValueId") REFERENCES "public"."OptionValue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DependencyRule" ADD CONSTRAINT "DependencyRule_targetOptionGroupId_fkey" FOREIGN KEY ("targetOptionGroupId") REFERENCES "public"."OptionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DependencyRule" ADD CONSTRAINT "DependencyRule_targetOptionValueId_fkey" FOREIGN KEY ("targetOptionValueId") REFERENCES "public"."OptionValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Quote" ADD CONSTRAINT "Quote_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteItem" ADD CONSTRAINT "QuoteItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteItem" ADD CONSTRAINT "QuoteItem_optionGroupId_fkey" FOREIGN KEY ("optionGroupId") REFERENCES "public"."OptionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteItem" ADD CONSTRAINT "QuoteItem_optionValueId_fkey" FOREIGN KEY ("optionValueId") REFERENCES "public"."OptionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteDiscount" ADD CONSTRAINT "QuoteDiscount_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteHistory" ADD CONSTRAINT "QuoteHistory_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "public"."Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."QuoteHistory" ADD CONSTRAINT "QuoteHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
