import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTableCreator,
	primaryKey,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";
import type { AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator((name) => `devcrm_${name}`);

// Role & Enums
export const userRoleEnum = pgEnum("devcrm_user_role", ["SUPER_ADMIN", "USER"]);
export const orgRoleEnum = pgEnum("devcrm_org_role", [
	"OWNER",
	"ADMIN",
	"MEMBER",
	"VIEWER",
]);
export const subscriptionStatusEnum = pgEnum("devcrm_subscription_status", [
	"ACTIVE",
	"TRIALING",
	"CANCELED",
	"PAST_DUE",
]);
export const leadStatusEnum = pgEnum("devcrm_lead_status", [
	"NEW",
	"QUALIFIED",
	"CONTACTED",
	"NURTURING",
	"UNQUALIFIED",
]);
export const qualificationStatusEnum = pgEnum("devcrm_qualification_status", [
	"NONE",
	"MQL",
	"SQL",
	"DISQUALIFIED",
]);
export const dealStatusEnum = pgEnum("devcrm_deal_status", [
	"OPEN",
	"WON",
	"LOST",
]);

// --- AUTH & USERS TABLES ---
export const users = createTable("user", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: d.varchar({ length: 255 }),
	email: d.varchar({ length: 255 }).notNull().unique(),
	emailVerified: d.timestamp({ mode: "date", withTimezone: true }),
	image: d.varchar({ length: 255 }),
	phone: d.varchar({ length: 50 }),
	passwordHash: d.text(),
	systemRole: userRoleEnum("system_role").default("USER").notNull(),
	onboardingComplete: d.boolean().default(false).notNull(),
	hasSeenWelcome: d.boolean().default(false).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const accounts = createTable(
	"account",
	(d) => ({
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
		provider: d.varchar({ length: 255 }).notNull(),
		providerAccountId: d.varchar({ length: 255 }).notNull(),
		refresh_token: d.text(),
		access_token: d.text(),
		expires_at: d.integer(),
		token_type: d.varchar({ length: 255 }),
		scope: d.varchar({ length: 255 }),
		id_token: d.text(),
		session_state: d.varchar({ length: 255 }),
	}),
	(t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = createTable("session", (d) => ({
	sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
	userId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
}));

export const verificationTokens = createTable(
	"verification_token",
	(d) => ({
		identifier: d.varchar({ length: 255 }).notNull(),
		token: d.varchar({ length: 255 }).notNull(),
		expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	}),
	(t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// --- MULTI-TENANCY & ORGANIZATIONS ---
export const organizations = createTable("organization", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: d.varchar({ length: 255 }).notNull(),
	slug: d.varchar({ length: 255 }).notNull().unique(),
	logoUrl: d.text(),
	isActive: d.boolean().default(true).notNull(),

	// Advanced Onboarding Fields
	displayName: d.varchar({ length: 255 }),
	teamSize: d.varchar({ length: 50 }),
	website: d.varchar({ length: 255 }),
	phone: d.varchar({ length: 50 }),
	countryCode: d.varchar({ length: 10 }),
	phoneVerified: d.boolean().default(false).notNull(),
	country: d.varchar({ length: 100 }),
	currency: d.varchar({ length: 10 }),
	hasGst: d.boolean().default(false).notNull(),
	gstin: d.varchar({ length: 50 }),
	businessPan: d.varchar({ length: 50 }),
	useCases: d.text(),
	businessType: d.varchar({ length: 100 }),
	addressStreet: d.text(),
	addressCity: d.varchar({ length: 100 }),
	addressState: d.varchar({ length: 100 }),
	addressCountry: d.varchar({ length: 100 }),
	addressPincode: d.varchar({ length: 20 }),

	svixAppId: d.varchar({ length: 255 }), // Used to map the org to a Svix application for webhooks
	customDomain: d.varchar({ length: 255 }).unique(),
	customDomainVerified: d.boolean().default(false).notNull(),
	customDomainCname: d.varchar({ length: 255 }),
	planId: d.varchar({ length: 255 }),

	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const organizationMembers = createTable(
	"organization_member",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		organizationId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => organizations.id, { onDelete: "cascade" }),
		userId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: orgRoleEnum("role").default("MEMBER").notNull(),
	permissions: d.text(), // JSON permission matrix for CUSTOM_ROLE
		createdAt: d
			.timestamp({ withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
	}),
	(t) => [index("org_user_idx").on(t.organizationId, t.userId)],
);

// --- SUBSCRIPTIONS & PLANS ---
export const subscriptionPlans = createTable("subscription_plan", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: d.varchar({ length: 255 }).notNull(),
	code: d.varchar({ length: 100 }).notNull().unique(),
	description: d.text(),
	priceMonthly: d.integer().notNull(),
	priceYearly: d.integer().notNull(),
	maxUsers: d.integer().default(5).notNull(),
	maxContacts: d.integer().default(1000).notNull(),
	isActive: d.boolean().default(true).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const subscriptions = createTable("subscription", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	planId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => subscriptionPlans.id),
	status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
	currentPeriodStart: d.timestamp({ withTimezone: true }).notNull(),
	currentPeriodEnd: d.timestamp({ withTimezone: true }).notNull(),
	cancelAtPeriodEnd: d.boolean().default(false).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const tenantOverrides = createTable("tenant_override", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.unique()
		.references(() => organizations.id, { onDelete: "cascade" }),
	featureOverrides: d.text(), // JSON of boolean feature overrides
	quotaOverrides: d.text(),   // JSON of numeric quota overrides
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));


// --- CRM: COMPANIES & CONTACTS ---
export const companies = createTable("company", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	name: d.varchar({ length: 255 }).notNull(),
	logoUrl: d.text(),
	domain: d.varchar({ length: 255 }),
	industry: d.varchar({ length: 100 }),
	employeeCount: d.integer(), // Keeping for backwards compat
	teamSize: d.varchar({ length: 50 }),
	phone: d.varchar({ length: 50 }),
	countryCode: d.varchar({ length: 10 }),
	country: d.varchar({ length: 100 }),
	currency: d.varchar({ length: 10 }),
	hasGst: d.boolean().default(false).notNull(),
	gstin: d.varchar({ length: 50 }),
	businessPan: d.text(),
	businessType: d.varchar({ length: 100 }),
	useCases: d.text(),
	addressStreet: d.text(),
	addressCity: d.varchar({ length: 100 }),
	addressState: d.varchar({ length: 100 }),
	addressCountry: d.varchar({ length: 100 }),
	addressPincode: d.varchar({ length: 20 }),
	address: d.text(), // legacy

	// New Complex Contact Fields
	clientType: d.varchar({ length: 50 }),
	taxTreatment: d.varchar({ length: 50 }),
	extraIds: d.jsonb().default([]), // array of strings or objects
	shippingDetails: d.jsonb().default([]),
	alias: d.varchar({ length: 255 }),
	uid: d.varchar({ length: 100 }),
	email: d.varchar({ length: 255 }),
	showEmailInInvoice: d.boolean().default(false).notNull(),
	showPhoneInInvoice: d.boolean().default(false).notNull(),
	paymentDueDays: d.integer(),
	customFields: d.jsonb().default([]),
	attachments: d.jsonb().default([]),

	assignedUserId: d
		.varchar({ length: 255 })
		.references(() => users.id, { onDelete: "set null" }),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const contacts = createTable("contact", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	companyId: d
		.varchar({ length: 255 })
		.references(() => companies.id, { onDelete: "set null" }), // Linked client/company
	uid: d.varchar({ length: 100 }), // Auto-generated ID

	// Basic Info
	avatarUrl: d.text(),
	salutation: d.varchar({ length: 20 }), // Mr, Mrs, Dr, etc.
	firstName: d.varchar({ length: 100 }).notNull(),
	lastName: d.varchar({ length: 100 }),

	// Contact Methods
	email: d.varchar({ length: 255 }), // Primary email
	phone: d.varchar({ length: 50 }), // Primary phone
	additionalEmails: d.jsonb().default([]), // Array of emails
	additionalPhones: d.jsonb().default([]), // Array of phones

	// Tax Info
	pan: d.text(),
	aadhaar: d.text(),
	passport: d.text(),

	// Social Profiles
	socialLinks: d.jsonb().default({}), // Object with fb, linkedin, twitter, etc.

	// Lead Scoring & Qualification
	leadScore: d.integer().default(0).notNull(),
	qualificationStatus: qualificationStatusEnum("qualification_status")
		.default("NONE")
		.notNull(),

	// Address
	addressCountry: d.varchar({ length: 100 }),
	addressState: d.varchar({ length: 100 }),
	addressDistrict: d.varchar({ length: 100 }),
	addressCity: d.varchar({ length: 100 }),
	addressBuilding: d.varchar({ length: 255 }),
	addressStreet: d.text(),
	addressZip: d.varchar({ length: 20 }),

	adCampaignId: d
		.varchar({ length: 255 })
		.references(() => adCampaigns.id, { onDelete: "set null" }),

	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const tags = createTable("tag", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	name: d.varchar({ length: 50 }).notNull(),
	color: d.varchar({ length: 20 }).default("#3b82f6").notNull(),
}));

export const activityNotes = createTable("activity_note", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	companyId: d
		.varchar({ length: 255 })
		.references(() => companies.id, { onDelete: "cascade" }),
	dealId: d
		.varchar({ length: 255 })
		.references(() => deals.id, { onDelete: "cascade" }),
	contactId: d
		.varchar({ length: 255 })
		.references(() => contacts.id, { onDelete: "cascade" }),
	authorId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id),
	type: d.varchar({ length: 50 }).default("NOTE").notNull(), // NOTE, CALL, EMAIL, MEETING
	content: d.text().notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const assignmentHistory = createTable("assignment_history", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	companyId: d
		.varchar({ length: 255 })
		.references(() => companies.id, { onDelete: "cascade" }),
	assignedByUserId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id),
	assignedToUserId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id),
	assignedAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

// --- PIPELINES & DEALS ---
export const pipelines = createTable("pipeline", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	name: d.varchar({ length: 255 }).notNull(),
	isDefault: d.boolean().default(false).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const pipelineStages = createTable("pipeline_stage", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	pipelineId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => pipelines.id, { onDelete: "cascade" }),
	name: d.varchar({ length: 255 }).notNull(),
	orderIndex: d.integer().notNull(),
	winProbability: d.integer().default(50).notNull(),
	color: d.varchar({ length: 20 }).default("#3b82f6").notNull(),
}));

export const deals = createTable("deal", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	pipelineId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => pipelines.id, { onDelete: "cascade" }),
	stageId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => pipelineStages.id, { onDelete: "cascade" }),
	title: d.varchar({ length: 255 }).notNull(),
	value: d.integer().default(0).notNull(),
	expectedCloseDate: d.timestamp({ withTimezone: true }),
	companyId: d
		.varchar({ length: 255 })
		.references(() => companies.id, { onDelete: "set null" }),
	contactId: d
		.varchar({ length: 255 })
		.references(() => contacts.id, { onDelete: "set null" }),
	assignedUserId: d
		.varchar({ length: 255 })
		.references(() => users.id, { onDelete: "set null" }),
	status: dealStatusEnum("status").default("OPEN").notNull(),
	orderIndex: d.integer().default(0).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const invoiceStatusEnum = pgEnum("devcrm_invoice_status", [
	"DRAFT",
	"PROFORMA",
	"SENT",
	"VIEWED",
	"PARTIALLY_PAID",
	"PAID",
	"OVERDUE",
	"VOID",
	"CREDIT_NOTE_ISSUED",
	"CANCELLED",
]);

// --- PRODUCTS & INVENTORY ---
export const productTypeEnum = pgEnum("devcrm_product_type", [
	"PRODUCT",
	"SERVICE",
]);

export const products = createTable("product", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	name: d.varchar({ length: 255 }).notNull(),
	sku: d.varchar({ length: 100 }),
	type: productTypeEnum("type").default("PRODUCT").notNull(),
	description: d.text(),
	unitPrice: d.integer().notNull(), // in cents
	unit: d.varchar({ length: 50 }),
	stockQuantity: d.integer().default(0).notNull(),
	reservedQuantity: d.integer().default(0).notNull(),
	isPublic: d.boolean().default(false).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const dealProducts = createTable("deal_product", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	dealId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => deals.id, { onDelete: "cascade" }),
	productId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	quantity: d.integer().default(1).notNull(),
	unitPrice: d.integer().notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const stockMovementTypeEnum = pgEnum("devcrm_stock_movement_type", [
	"INVOICE_FULFILLMENT",
	"RESTOCK",
	"ADJUSTMENT",
	"RETURN",
]);

export const stockMovements = createTable("stock_movement", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	productId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => products.id, { onDelete: "cascade" }),
	invoiceId: d
		.varchar({ length: 255 })
		.references(() => invoices.id, { onDelete: "set null" }),
	type: stockMovementTypeEnum("type").default("INVOICE_FULFILLMENT").notNull(),
	quantity: d.integer().notNull(),
	previousStock: d.integer().notNull(),
	newStock: d.integer().notNull(),
	reason: d.text(),
	performedByUserId: d
		.varchar({ length: 255 })
		.references(() => users.id, { onDelete: "set null" }),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

// --- SETTINGS ---
export const userSettings = createTable("user_settings", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	userId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	defaultCurrency: d.varchar({ length: 10 }).default("INR").notNull(),
	customCurrencySymbol: d.varchar({ length: 10 }),
	numberFormat: d.varchar({ length: 50 }).default("en-IN").notNull(),
	decimalDigits: d.integer().default(2).notNull(),
	roundQuantity: d.boolean().default(false).notNull(),
	roundRate: d.boolean().default(false).notNull(),
	customLabels: d.jsonb(),
	signatureImage: d.text(),
	tncList: d.jsonb(),
	theme: d.varchar({ length: 50 }).default("light").notNull(),
	locale: d.varchar({ length: 50 }).default("en-US").notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// --- QUOTES & INVOICES ---
export const quotes = createTable("quote", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	companyId: d.varchar({ length: 255 }).references(() => companies.id),
	dealId: d
		.varchar({ length: 255 })
		.references(() => deals.id, { onDelete: "set null" }),
	quoteNumber: d.varchar({ length: 100 }).notNull(),
	version: d.integer().default(1).notNull(),
	title: d.varchar({ length: 255 }),
	date: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
	dueDate: d.timestamp({ mode: "date", withTimezone: true }),

	// Customizations
	labels: d.jsonb(),
	customFields: d.jsonb(),
	showTotalInPdf: d.boolean().default(true).notNull(),
	showTotalInWords: d.boolean().default(false).notNull(),

	// Pricing & Items
	lineItems: d.jsonb(), // Stores the array of items to allow ad-hoc text & rich descriptions
	taxPercent: d.integer().default(0).notNull(),
	discountType: d.varchar({ length: 20 }).default("AMOUNT").notNull(), // AMOUNT or PERCENT
	discountValue: d.integer().default(0).notNull(), // in cents if AMOUNT, percent if PERCENT
	additionalCharges: d.jsonb(),
	totalAmount: d.integer().default(0).notNull(),

	// Footer & Extras
	signatureType: d.varchar({ length: 50 }).default("IMAGE").notNull(),
	signatureName: d.varchar({ length: 255 }),
	signatureData: d.text(), // Image URL or Base64
	notes: d.text(),
	attachments: d.jsonb(),
	terms: d.jsonb(), // Ordered list
	contactEmail: d.varchar({ length: 255 }),
	contactPhone: d.varchar({ length: 50 }),

	status: d.varchar({ length: 50 }).default("DRAFT").notNull(),
	signedAt: d.timestamp({ withTimezone: true }),
	signerIp: d.varchar({ length: 100 }),
	signerEmail: d.varchar({ length: 255 }),
	taxDetails: d.jsonb(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const invoices = createTable("invoice", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	quoteId: d.varchar({ length: 255 }).references(() => quotes.id),
	companyId: d.varchar({ length: 255 }).references(() => companies.id),
	invoiceNumber: d.varchar({ length: 100 }).notNull(),
	version: d.integer().default(1).notNull(),

	// Content from Quote
	title: d.varchar({ length: 255 }),
	labels: d.jsonb(),
	customFields: d.jsonb(),
	showTotalInPdf: d.boolean().default(true).notNull(),
	showTotalInWords: d.boolean().default(false).notNull(),
	lineItems: d.jsonb(),
	taxPercent: d.integer().default(0).notNull(),
	discountType: d.varchar({ length: 20 }).default("AMOUNT").notNull(),
	discountValue: d.integer().default(0).notNull(),
	additionalCharges: d.jsonb(),

	signatureType: d.varchar({ length: 50 }).default("IMAGE").notNull(),
	signatureName: d.varchar({ length: 255 }),
	signatureData: d.text(),
	notes: d.text(),
	attachments: d.jsonb(),
	terms: d.jsonb(),
	contactEmail: d.varchar({ length: 255 }),
	contactPhone: d.varchar({ length: 50 }),

	status: invoiceStatusEnum("status").default("DRAFT").notNull(),
	subtotal: d.integer().notNull(),
	taxAmount: d.integer().notNull(),
	totalAmount: d.integer().notNull(),
	amountPaid: d.integer().default(0).notNull(),
	balanceDue: d.integer().notNull(),
	dueDate: d.timestamp({ withTimezone: true }).notNull(),
	paidAt: d.timestamp({ withTimezone: true }),
	paymentLinkUrl: d.text(),
	viewedAt: d.timestamp({ withTimezone: true }),
	creditNoteNumber: d.varchar({ length: 100 }),
	creditNoteReason: d.text(),
	fulfilledAt: d.timestamp({ withTimezone: true }),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const quoteRelations = relations(quotes, ({ one }) => ({
	company: one(companies, {
		fields: [quotes.companyId],
		references: [companies.id],
	}),
	deal: one(deals, {
		fields: [quotes.dealId],
		references: [deals.id],
	}),
}));

export const dealProductsRelations = relations(dealProducts, ({ one }) => ({
	deal: one(deals, {
		fields: [dealProducts.dealId],
		references: [deals.id],
	}),
	product: one(products, {
		fields: [dealProducts.productId],
		references: [products.id],
	}),
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
	company: one(companies, {
		fields: [invoices.companyId],
		references: [companies.id],
	}),
	quote: one(quotes, {
		fields: [invoices.quoteId],
		references: [quotes.id],
	}),
	payments: many(payments),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
	product: one(products, {
		fields: [stockMovements.productId],
		references: [products.id],
	}),
	invoice: one(invoices, {
		fields: [stockMovements.invoiceId],
		references: [invoices.id],
	}),
	performedBy: one(users, {
		fields: [stockMovements.performedByUserId],
		references: [users.id],
	}),
}));

export const taskPriorityEnum = pgEnum("devcrm_task_priority", [
	"LOW",
	"MEDIUM",
	"HIGH",
	"URGENT",
]);
export const taskStatusEnum = pgEnum("devcrm_task_status", [
	"PENDING",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELLED",
]);
export const paymentMethodEnum = pgEnum("devcrm_payment_method", [
	"BANK_TRANSFER",
	"CREDIT_CARD",
	"CASH",
	"CHECK",
]);

export const payments = createTable("payment", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	invoiceId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => invoices.id, { onDelete: "cascade" }),
	amount: d.integer().notNull(), // in cents
	paymentDate: d.timestamp({ withTimezone: true }).notNull(),
	paymentMethod: paymentMethodEnum("paymentMethod").notNull(), // BANK_TRANSFER, CASH, CREDIT_CARD, CHECK
	referenceNumber: d.varchar({ length: 255 }), // e.g. Check number, TXN ID
	notes: d.text(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
	invoice: one(invoices, {
		fields: [payments.invoiceId],
		references: [invoices.id],
	}),
	organization: one(organizations, {
		fields: [payments.organizationId],
		references: [organizations.id],
	}),
}));

export const statements = createTable("statement", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	companyId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => companies.id, { onDelete: "cascade" }),
	statementNumber: d.varchar({ length: 100 }).notNull(),
	startDate: d.timestamp({ withTimezone: true }).notNull(),
	endDate: d.timestamp({ withTimezone: true }).notNull(),
	openingBalance: d.integer().notNull(), // in cents
	closingBalance: d.integer().notNull(), // in cents
	transactions: d.jsonb().notNull(), // array of snapshot transactions
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const statementRelations = relations(statements, ({ one }) => ({
	organization: one(organizations, {
		fields: [statements.organizationId],
		references: [organizations.id],
	}),
	company: one(companies, {
		fields: [statements.companyId],
		references: [companies.id],
	}),
}));

// --- CLIENT SUBSCRIPTIONS ---
export const clientSubscriptionStatusEnum = pgEnum(
	"devcrm_client_subscription_status",
	["ACTIVE", "CANCELLED", "EXPIRED"],
);
export const clientSubscriptionCycleEnum = pgEnum(
	"devcrm_client_subscription_cycle",
	["MONTHLY", "YEARLY"],
);

export const clientSubscriptions = createTable("client_subscription", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	companyId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => companies.id, { onDelete: "cascade" }),
	productId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => products.id),
	status: clientSubscriptionStatusEnum("status").default("ACTIVE").notNull(),
	billingCycle: clientSubscriptionCycleEnum("billing_cycle")
		.default("MONTHLY")
		.notNull(),
	price: d.integer().notNull(), // in cents
	startDate: d.timestamp({ withTimezone: true }).notNull(),
	nextRenewalDate: d.timestamp({ withTimezone: true }).notNull(),
	lastRenewalDate: d.timestamp({ withTimezone: true }),
	failedAttempts: d.integer().default(0).notNull(),
	dunningStatus: d.varchar({ length: 50 }).default("NONE").notNull(),
	dunningAlertSentAt: d.timestamp({ withTimezone: true }),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const clientSubscriptionRelations = relations(
	clientSubscriptions,
	({ one }) => ({
		organization: one(organizations, {
			fields: [clientSubscriptions.organizationId],
			references: [organizations.id],
		}),
		company: one(companies, {
			fields: [clientSubscriptions.companyId],
			references: [companies.id],
		}),
		product: one(products, {
			fields: [clientSubscriptions.productId],
			references: [products.id],
		}),
	}),
);

// --- MARKETING & AUTOMATION REMINDERS ---
export const adCampaigns = createTable("ad_campaign", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	name: d.varchar({ length: 255 }).notNull(),
	platform: d.varchar({ length: 100 }).notNull(), // GOOGLE_ADS, FACEBOOK_ADS, LINKEDIN_ADS, TWITTER_ADS
	spend: d.integer().default(0).notNull(), // in cents
	clicks: d.integer().default(0).notNull(),
	impressions: d.integer().default(0).notNull(),
	conversions: d.integer().default(0).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const crmTasks = createTable("crm_task", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	dealId: d
		.varchar({ length: 255 })
		.references(() => deals.id, { onDelete: "set null" }),
	assignedUserId: d
		.varchar({ length: 255 })
		.references(() => users.id, { onDelete: "set null" }),
	title: d.varchar({ length: 255 }).notNull(),
	description: d.text(),
	dueDate: d.timestamp({ withTimezone: true }).notNull(),
	priority: taskPriorityEnum("priority").default("MEDIUM").notNull(),
	status: taskStatusEnum("status").default("PENDING").notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const notifications = createTable("notification", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	userId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	title: d.varchar({ length: 255 }).notNull(),
	message: d.text().notNull(),
	link: d.varchar({ length: 255 }),
	isRead: d.boolean().default(false).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const automationTriggerEnum = pgEnum("devcrm_automation_trigger", [
	"INVOICE_DUE",
	"SUBSCRIPTION_RENEWAL",
	"DEAL_STALLED",
	"QUOTE_SENT",
	"DEAL_STAGE_CHANGED",
	"DEAL_WON",
	"INVOICE_CREATED",
	"INVOICE_PAID",
	"INVENTORY_LOW_STOCK",
	"QUOTE_ACCEPTED",
]);
export const automationActionEnum = pgEnum("devcrm_automation_action", [
	"CREATE_NOTIFICATION",
	"CREATE_TASK",
	"SEND_EMAIL",
	"INTERNAL_ALERT",
	"DISPATCH_WEBHOOK",
	"ADJUST_INVENTORY",
]);

export const automationRules = createTable("automation_rule", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	name: d.varchar({ length: 255 }).notNull(),
	triggerType: automationTriggerEnum("trigger_type").notNull(),
	daysOffset: d.integer().default(0).notNull(), // e.g. -7 for 7 days before
	actionType: automationActionEnum("action_type").notNull(),
	actionPayload: d.jsonb().default({}).notNull(),
	conditions: d.jsonb(),
	isActive: d.boolean().default(true).notNull(),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const automationLogs = createTable("automation_log", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	ruleId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => automationRules.id, { onDelete: "cascade" }),
	targetEntityId: d.varchar({ length: 255 }).notNull(),
	status: d.varchar({ length: 50 }).default("SUCCESS").notNull(),
	details: d.jsonb(),
	executedAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

export const communications = createTable("communication", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	companyId: d
		.varchar({ length: 255 })
		.references(() => companies.id, { onDelete: "cascade" }),
	targetEntityId: d.varchar({ length: 255 }),
	type: d.varchar({ length: 50 }).notNull(), // e.g. "EMAIL"
	subject: d.varchar({ length: 255 }).notNull(),
	body: d.text().notNull(),
	sentAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
}));

// --- PUBLIC API & WEBHOOKS ---
export const apiKeys = createTable("api_key", (d) => ({
	id: d
		.varchar({ length: 255 })
		.notNull()
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	organizationId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => organizations.id, { onDelete: "cascade" }),
	userId: d
		.varchar({ length: 255 })
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	name: d.varchar({ length: 255 }).notNull(),
	keyHash: d.text().notNull(),
	expiresAt: d.timestamp({ withTimezone: true }),
	revokedAt: d.timestamp({ withTimezone: true }),
	createdAt: d
		.timestamp({ withTimezone: true })
		.$defaultFn(() => new Date())
		.notNull(),
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
	organization: one(organizations, {
		fields: [apiKeys.organizationId],
		references: [organizations.id],
	}),
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id],
	}),
}));

// --- GLOBAL SETTINGS ---
export const globalSettings = createTable("global_settings", (d) => ({
	id: d.varchar({ length: 255 }).notNull().primaryKey().default("default"),
	maintenanceMode: d.boolean().default(false).notNull(),
	enableBetaFeatures: d.boolean().default(false).notNull(),
	featureFlags: d.text(), // JSON serialized Record<FeatureKey, boolean>
	updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// --- SYSTEM AUDIT LOG ---
export const systemAuditLogs = createTable(
	"system_audit_log",
	(d) => ({
		id: d
			.varchar({ length: 255 })
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		actorId: d
			.varchar({ length: 255 })
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		actorEmail: d.varchar({ length: 255 }).notNull(),
		action: d.varchar({ length: 100 }).notNull(),
		targetType: d.varchar({ length: 50 }),
		targetId: d.varchar({ length: 255 }),
		metadata: d.text(), // JSON stringified metadata object
		ipAddress: d.varchar({ length: 100 }),
		createdAt: d
			.timestamp({ withTimezone: true })
			.$defaultFn(() => new Date())
			.notNull(),
	}),
	(t) => [
		index("audit_actor_idx").on(t.actorId),
		index("audit_action_idx").on(t.action),
		index("audit_target_idx").on(t.targetId),
		index("audit_created_idx").on(t.createdAt),
	],
);

export const systemAuditLogsRelations = relations(
	systemAuditLogs,
	({ one }) => ({
		actor: one(users, {
			fields: [systemAuditLogs.actorId],
			references: [users.id],
		}),
	}),
);
