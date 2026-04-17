--
-- PostgreSQL database dump
--

\restrict IPpPGfTjeqe6PxJxzKNGjpjViC82gTGBjeCUXYgIoQ7GardIIcqIXuiZzIV2i8q

-- Dumped from database version 17.8
-- Dumped by pg_dump version 17.8

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_requests DROP CONSTRAINT IF EXISTS service_requests_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_requests DROP CONSTRAINT IF EXISTS service_requests_service_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_requests DROP CONSTRAINT IF EXISTS service_requests_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_contractor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_reporter_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_contractor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profile_reviews DROP CONSTRAINT IF EXISTS profile_reviews_reviewer_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.profile_reviews DROP CONSTRAINT IF EXISTS profile_reviews_profile_id_fkey;
ALTER TABLE IF EXISTS ONLY public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_contractor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_booking_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_resets DROP CONSTRAINT IF EXISTS password_resets_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_chat_id_fkey;
ALTER TABLE IF EXISTS ONLY public.contractors DROP CONSTRAINT IF EXISTS contractors_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_contractor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_contractor_id_fkey;
DROP INDEX IF EXISTS public.idx_users_phone;
DROP INDEX IF EXISTS public.idx_users_location_lat_lng;
DROP INDEX IF EXISTS public.idx_svc_req_status;
DROP INDEX IF EXISTS public.idx_svc_req_created;
DROP INDEX IF EXISTS public.idx_svc_cat_type;
DROP INDEX IF EXISTS public.idx_svc_cat_active;
DROP INDEX IF EXISTS public.idx_services_category;
DROP INDEX IF EXISTS public.idx_services_active;
DROP INDEX IF EXISTS public.idx_reviews_contractor;
DROP INDEX IF EXISTS public.idx_profiles_handle_lower;
DROP INDEX IF EXISTS public.idx_profiles_geo_earth;
DROP INDEX IF EXISTS public.idx_profile_reviews_profile_id;
DROP INDEX IF EXISTS public.idx_portfolio_items_contractor;
DROP INDEX IF EXISTS public.idx_payments_booking;
DROP INDEX IF EXISTS public.idx_otps_phone;
DROP INDEX IF EXISTS public.idx_messages_sender;
DROP INDEX IF EXISTS public.idx_messages_created;
DROP INDEX IF EXISTS public.idx_messages_chat;
DROP INDEX IF EXISTS public.idx_contractors_verified;
DROP INDEX IF EXISTS public.idx_contractors_user;
DROP INDEX IF EXISTS public.idx_contractors_rating_desc;
DROP INDEX IF EXISTS public.idx_contractors_lat_long;
DROP INDEX IF EXISTS public.idx_contractors_geo_earth;
DROP INDEX IF EXISTS public.idx_contractors_featured;
DROP INDEX IF EXISTS public.idx_contractors_category;
DROP INDEX IF EXISTS public.idx_chats_customer;
DROP INDEX IF EXISTS public.idx_chats_contractor;
DROP INDEX IF EXISTS public.idx_bookings_tier;
DROP INDEX IF EXISTS public.idx_bookings_status;
DROP INDEX IF EXISTS public.idx_bookings_customer;
DROP INDEX IF EXISTS public.idx_bookings_contractor;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_phone_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.site_settings DROP CONSTRAINT IF EXISTS site_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_refresh_token_key;
ALTER TABLE IF EXISTS ONLY public.sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_slug_unique;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE IF EXISTS ONLY public.service_requests DROP CONSTRAINT IF EXISTS service_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.service_categories DROP CONSTRAINT IF EXISTS service_categories_slug_key;
ALTER TABLE IF EXISTS ONLY public.service_categories DROP CONSTRAINT IF EXISTS service_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.reviews DROP CONSTRAINT IF EXISTS reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.reports DROP CONSTRAINT IF EXISTS reports_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.profiles DROP CONSTRAINT IF EXISTS profiles_handle_key;
ALTER TABLE IF EXISTS ONLY public.profile_reviews DROP CONSTRAINT IF EXISTS profile_reviews_profile_id_reviewer_user_id_key;
ALTER TABLE IF EXISTS ONLY public.profile_reviews DROP CONSTRAINT IF EXISTS profile_reviews_pkey;
ALTER TABLE IF EXISTS ONLY public.portfolio_items DROP CONSTRAINT IF EXISTS portfolio_items_pkey;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_razorpay_payment_id_key;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_razorpay_order_id_key;
ALTER TABLE IF EXISTS ONLY public.payments DROP CONSTRAINT IF EXISTS payments_pkey;
ALTER TABLE IF EXISTS ONLY public.password_resets DROP CONSTRAINT IF EXISTS password_resets_pkey;
ALTER TABLE IF EXISTS ONLY public.otps DROP CONSTRAINT IF EXISTS otps_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.messages DROP CONSTRAINT IF EXISTS messages_pkey;
ALTER TABLE IF EXISTS ONLY public.contractors DROP CONSTRAINT IF EXISTS contractors_pkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_pkey;
ALTER TABLE IF EXISTS ONLY public.chats DROP CONSTRAINT IF EXISTS chats_customer_id_contractor_id_key;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE IF EXISTS public.messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chats ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.site_settings;
DROP TABLE IF EXISTS public.sessions;
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.service_requests;
DROP TABLE IF EXISTS public.service_categories;
DROP TABLE IF EXISTS public.reviews;
DROP TABLE IF EXISTS public.reports;
DROP TABLE IF EXISTS public.profiles;
DROP TABLE IF EXISTS public.profile_reviews;
DROP TABLE IF EXISTS public.portfolio_items;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.password_resets;
DROP TABLE IF EXISTS public.otps;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.messages_id_seq;
DROP TABLE IF EXISTS public.messages;
DROP TABLE IF EXISTS public.contractors;
DROP SEQUENCE IF EXISTS public.chats_id_seq;
DROP TABLE IF EXISTS public.chats;
DROP TABLE IF EXISTS public.bookings;
DROP EXTENSION IF EXISTS "uuid-ossp";
DROP EXTENSION IF EXISTS pgcrypto;
DROP EXTENSION IF EXISTS earthdistance;
DROP EXTENSION IF EXISTS cube;
--
-- Name: cube; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS cube WITH SCHEMA public;


--
-- Name: EXTENSION cube; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION cube IS 'data type for multidimensional cubes';


--
-- Name: earthdistance; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS earthdistance WITH SCHEMA public;


--
-- Name: EXTENSION earthdistance; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION earthdistance IS 'calculate great-circle distances on the surface of the Earth';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id uuid,
    contractor_id uuid,
    service_category character varying(100) NOT NULL,
    service_tier character varying(30) DEFAULT 'quick'::character varying NOT NULL,
    payment_plan character varying(50) DEFAULT 'full_escrow'::character varying NOT NULL,
    status character varying(50) DEFAULT 'PENDING'::character varying,
    amount numeric(10,2) NOT NULL,
    estimated_project_value numeric(12,2),
    escrow_amount numeric(12,2),
    payment_status character varying(50) DEFAULT 'UNPAID'::character varying,
    milestone_details jsonb DEFAULT '[]'::jsonb,
    scheduled_for timestamp with time zone,
    address_label text,
    location_address text,
    location_lat numeric(10,8),
    location_lng numeric(11,8),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chats (
    id integer NOT NULL,
    customer_id uuid NOT NULL,
    contractor_id uuid NOT NULL,
    last_message_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: chats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chats_id_seq OWNED BY public.chats.id;


--
-- Name: contractors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contractors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    business_name text,
    description text,
    categories text[],
    services text[],
    rating numeric(3,2) DEFAULT 0,
    reviews_count integer DEFAULT 0,
    latitude numeric(9,6),
    longitude numeric(9,6),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    image_url text,
    portfolio_urls text[],
    id_proof_url text,
    is_available boolean DEFAULT true NOT NULL,
    category text,
    daily_rate integer,
    experience_years integer DEFAULT 0 NOT NULL,
    team_size integer DEFAULT 1 NOT NULL,
    is_labour_group boolean DEFAULT false NOT NULL,
    is_responsibility_model boolean DEFAULT false NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    photo_url text,
    location_text text,
    lat numeric(10,8),
    lng numeric(11,8),
    review_count integer DEFAULT 0 NOT NULL,
    views_count integer DEFAULT 0 NOT NULL,
    leads_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    portfolio_photos text[],
    verification_status text DEFAULT 'unverified'::text,
    tier text DEFAULT 'standard'::text
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    chat_id integer NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    message text NOT NULL,
    type character varying(50),
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: otps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.otps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone character varying(15) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: password_resets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_resets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    booking_id uuid,
    razorpay_order_id character varying(255) NOT NULL,
    razorpay_payment_id character varying(255),
    razorpay_signature character varying(255),
    amount numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'CREATED'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: portfolio_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contractor_id uuid,
    image_url text NOT NULL,
    title text,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: profile_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profile_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    profile_id uuid NOT NULL,
    reviewer_user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT profile_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    category_label character varying(100) NOT NULL,
    handle character varying(100) NOT NULL,
    display_name character varying(150) NOT NULL,
    bio text,
    avatar_url text,
    cover_photo_url text,
    location_lat numeric(10,8),
    location_lng numeric(11,8),
    location_text text,
    is_verified boolean DEFAULT false,
    rating numeric(3,2) DEFAULT 0.0,
    reviews_count integer DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid,
    contractor_id uuid,
    reason text,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contractor_id uuid,
    user_id uuid,
    rating smallint NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: service_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    name_hi text,
    slug text NOT NULL,
    description text,
    description_hi text,
    icon text,
    type text DEFAULT 'chhota'::text NOT NULL,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: service_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id uuid,
    category_id uuid,
    user_id uuid,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    customer_address text,
    preferred_date date,
    preferred_time text,
    notes text,
    status text DEFAULT 'pending'::text,
    type text DEFAULT 'chhota'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    name text NOT NULL,
    name_hi text,
    slug text NOT NULL,
    description text,
    description_hi text,
    price_starts_at integer,
    price_label text DEFAULT 'Starting at'::text,
    image_url text,
    icon text,
    rating numeric(3,2) DEFAULT 4.5,
    bookings_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    refresh_token text NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    key character varying(100) NOT NULL,
    value text DEFAULT ''::text NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text,
    phone text NOT NULL,
    password_hash text,
    role text DEFAULT 'customer'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    email text,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    location_lat numeric(10,8),
    location_lng numeric(11,8),
    location_accuracy_m numeric(8,2),
    location_source text,
    location_captured_at timestamp with time zone,
    CONSTRAINT users_location_lat_range_chk CHECK (((location_lat IS NULL) OR ((location_lat >= ('-90'::integer)::numeric) AND (location_lat <= (90)::numeric)))),
    CONSTRAINT users_location_lng_range_chk CHECK (((location_lng IS NULL) OR ((location_lng >= ('-180'::integer)::numeric) AND (location_lng <= (180)::numeric))))
);


--
-- Name: chats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats ALTER COLUMN id SET DEFAULT nextval('public.chats_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, customer_id, contractor_id, service_category, service_tier, payment_plan, status, amount, estimated_project_value, escrow_amount, payment_status, milestone_details, scheduled_for, address_label, location_address, location_lat, location_lng, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chats (id, customer_id, contractor_id, last_message_at, created_at) FROM stdin;
1	8c8c064e-e423-4d6a-9c7b-3a408e9e9b83	d86141c2-70c8-4119-81f6-392f8167196a	2026-03-04 22:46:25.215447+05:30	2026-03-04 22:46:13.315647+05:30
2	5edfaaaf-bd86-438c-ab56-95f77ff9f98f	d86141c2-70c8-4119-81f6-392f8167196a	2026-03-05 03:15:00.665576+05:30	2026-03-05 03:15:00.665576+05:30
\.


--
-- Data for Name: contractors; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contractors (id, user_id, business_name, description, categories, services, rating, reviews_count, latitude, longitude, created_at, image_url, portfolio_urls, id_proof_url, is_available, category, daily_rate, experience_years, team_size, is_labour_group, is_responsibility_model, is_verified, is_featured, photo_url, location_text, lat, lng, review_count, views_count, leads_count, updated_at, portfolio_photos, verification_status, tier) FROM stdin;
73ac87be-577f-4691-a1e4-e8918eec7577	88a4af69-6086-4f04-b19e-e25e3139916d	\N	i have 12 years of experience in development	{property}	{lasjflajsifjaofn;asdfa}	0.00	0	23.210283	77.410399	2026-02-28 10:17:25.374179+05:30	/uploads/e2cf20c563421c970778cd279d6d628e	{/uploads/e0ac8305bfbecb5760b02ac53ecd3eef,/uploads/59155af03a0cf72c7a2b350ec2f295f5,/uploads/76e91a736e547e17edbfbc8bc3213cac}	/uploads/f0952912139d28f58cf41e8ec39f7213	t	property	555	15	1	f	t	t	f	/uploads/e2cf20c563421c970778cd279d6d628e	ranikamlapati	23.21028315	77.41039873	0	12	3	2026-04-17 16:24:59.685607+05:30	{/uploads/e0ac8305bfbecb5760b02ac53ecd3eef,/uploads/59155af03a0cf72c7a2b350ec2f295f5,/uploads/76e91a736e547e17edbfbc8bc3213cac}	unverified	standard
d86141c2-70c8-4119-81f6-392f8167196a	c6db416c-fbb0-4da9-9eec-dcabd3706ecb	\N	i have 234 years of experience	{electrical}	{"electricity fitting"}	5.00	1	23.210282	77.410395	2026-02-28 23:23:49.000171+05:30	/uploads/efe77e4810a0032ec283d00b7f99dc4e	{/uploads/69d222ccccb80e840aae5b4fe85d6b9e,/uploads/bff16532122599176623d7067f4c1aac,/uploads/f93033a96eefa6857de9ce0f14e615cb,/uploads/eec61884f433a03ba93183f3f67f0689}	/uploads/a1d73926faa37fea21d359e09386d45b	f	electrical	200	12	1	f	t	t	f	/uploads/efe77e4810a0032ec283d00b7f99dc4e	manit bhopal	23.21028245	77.41039505	1	24	1	2026-04-17 16:24:59.685607+05:30	{/uploads/69d222ccccb80e840aae5b4fe85d6b9e,/uploads/bff16532122599176623d7067f4c1aac,/uploads/f93033a96eefa6857de9ce0f14e615cb,/uploads/eec61884f433a03ba93183f3f67f0689}	unverified	standard
d918f054-d708-4d44-ba55-a37e8a49f152	acd15477-69cf-4fc6-9437-c76abe0207b5	\N	adfasdfsdfff	{construction}	{asdfsdfa,stwtwt,rtyhsy}	0.00	0	23.210282	77.410441	2026-03-02 14:36:52.565563+05:30	/uploads/2160ebc97bece3bac641433f4ad95718	{/uploads/06cdce1218a6d8ea576d4efd292f027d}	/uploads/784c08b51113f3b2736c9dfcd89790a2	t	construction	5020	23	1	f	t	t	f	/uploads/2160ebc97bece3bac641433f4ad95718	Manit Bhopal	23.21028245	77.41044079	0	16	1	2026-04-17 16:24:59.685607+05:30	{/uploads/06cdce1218a6d8ea576d4efd292f027d}	unverified	standard
de657a1e-2802-4b9e-8054-d798800ceba4	767ba075-0b5b-4231-88a5-a17d17ec4d9d	\N	sdfasdfasdfasdfasd	{events}	{fdgasdarewtgf}	0.00	0	23.210280	77.410442	2026-04-17 16:43:00.96394+05:30	/uploads/1776424381117-1pu388.png	{/uploads/1776424381285-dyrv0x.png,/uploads/1776424381370-aihy9j.png,/uploads/1776424381402-9krkbi.png}	/uploads/1776424381484-x4ig3w.jpg	t	events	324	23	1	f	t	f	f	/uploads/1776424381117-1pu388.png	main road 3 bhopal	23.21028039	77.41044153	0	2	0	2026-04-17 16:44:11.775818+05:30	{/uploads/1776424381285-dyrv0x.png,/uploads/1776424381370-aihy9j.png,/uploads/1776424381402-9krkbi.png}	unverified	standard
e82b13d7-fb52-479a-8cf4-ee2edb00a3c7	9fd1dbba-d906-4d79-8b2e-b925a55fc4f0	\N	2344rqre	{electrical}	{"MCB/Switch Board","Panel Installation","Fan/Light Fitting"}	0.00	0	23.210269	77.410417	2026-04-13 17:34:09.816828+05:30	/uploads/1776081849875-2pljrm.jpg	{/uploads/1776081849919-57qo40.png}	/uploads/1776081849989-ngp5p6.png	t	electrical	322	3	23	t	f	f	f	/uploads/1776081849875-2pljrm.jpg	Unknown Location	23.21026938	77.41041675	0	2	0	2026-04-17 16:24:59.685607+05:30	{/uploads/1776081849919-57qo40.png}	unverified	standard
4d9e0a30-1813-47c7-8fc5-aa77c5e41ef4	abe15967-9a1d-49ae-b065-399ed3e0ddf5	\N	10 years of experience	{plumbing}	{pipes,leaks,fitting}	0.00	0	23.210283	77.410422	2026-03-03 11:09:47.022978+05:30	/uploads/1772516387080-x25jz8.jpeg	{/uploads/1772516387121-db7bfv.png,/uploads/1772516387136-4zko7f.png,/uploads/1772516387146-ho6b1t.png}	/uploads/1772516387179-unz0n2.png	t	plumbing	400	10	1	f	t	t	f	/uploads/1772516387080-x25jz8.jpeg	Ranikamlapati station	23.21028263	77.41042241	0	16	0	2026-04-17 16:38:18.621028+05:30	{/uploads/1772516387121-db7bfv.png,/uploads/1772516387136-4zko7f.png,/uploads/1772516387146-ho6b1t.png}	unverified	standard
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, chat_id, sender_id, content, is_read, created_at) FROM stdin;
1	1	8c8c064e-e423-4d6a-9c7b-3a408e9e9b83	hi this side alok	f	2026-03-04 22:46:25.202894+05:30
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, message, type, is_read, created_at) FROM stdin;
0140fdf9-dcc4-4734-b451-c4985257825a	88a4af69-6086-4f04-b19e-e25e3139916d	Your profile has been verified.	verification	f	2026-02-28 11:11:48.101796+05:30
\.


--
-- Data for Name: otps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.otps (id, phone, code, expires_at, used, created_at) FROM stdin;
e16c88e8-8fed-4d54-abdb-ed891dd8aba3	8303959728	447375	2026-03-03 02:18:29.669792+05:30	f	2026-03-03 02:08:29.669792+05:30
\.


--
-- Data for Name: password_resets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_resets (id, user_id, token, expires_at, used, created_at) FROM stdin;
f4c9e997-a609-4626-9592-1b0b0ca891ea	5edfaaaf-bd86-438c-ab56-95f77ff9f98f	f3e6a17cd79b2cb2790ce36b75c4dcc0b3cc6695dc46f5a9d63f6abdc03793db	2026-03-05 00:06:01.5057+05:30	f	2026-03-04 23:06:01.5057+05:30
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payments (id, booking_id, razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status, created_at) FROM stdin;
\.


--
-- Data for Name: portfolio_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portfolio_items (id, contractor_id, image_url, title, description, created_at) FROM stdin;
\.


--
-- Data for Name: profile_reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profile_reviews (id, profile_id, reviewer_user_id, rating, comment, created_at) FROM stdin;
\.


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, user_id, category_label, handle, display_name, bio, avatar_url, cover_photo_url, location_lat, location_lng, location_text, is_verified, rating, reviews_count, metadata, created_at, updated_at) FROM stdin;
32c0470f-a359-4daf-8dde-e26f2269c8e5	5edfaaaf-bd86-438c-ab56-95f77ff9f98f	student	alkaar	Alok kumar 	computer science student at nit bhopal	/uploads/1775151086653-ui5vte.jpg	/uploads/1775151081572-gsni5u.jpg	23.21027921	77.41049147	Unknown Location	f	0.00	0	{"website": "", "specialization": "software engineering", "operating_hours": "9 am to 5 pm"}	2026-04-02 22:45:56.068042+05:30	2026-04-02 23:01:39.003116+05:30
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reports (id, reporter_id, contractor_id, reason, status, created_at) FROM stdin;
\.


--
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reviews (id, contractor_id, user_id, rating, comment, created_at) FROM stdin;
c81e898b-8aa7-49e6-b4d5-c14b17fe6d8d	d86141c2-70c8-4119-81f6-392f8167196a	8c8c064e-e423-4d6a-9c7b-3a408e9e9b83	5	I am totally satisfied with the work of this person.	2026-03-04 22:01:55.821111+05:30
\.


--
-- Data for Name: service_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_categories (id, name, name_hi, slug, description, description_hi, icon, type, display_order, is_active, created_at, updated_at) FROM stdin;
a2749b64-4229-44f3-8566-4d5185296e7c	AC & Appliance Repair	AC और अप्लायंस रिपेयर	ac-appliance-repair	AC servicing, fridge repair, washing machine repair and more	AC सर्विसिंग, फ्रिज रिपेयर, वॉशिंग मशीन रिपेयर और भी बहुत कुछ	snowflake	chhota	1	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
55869b5b-5bf6-45e5-af2e-3d4a863396b2	Home Cleaning	होम क्लीनिंग	home-cleaning	Deep cleaning, bathroom cleaning, kitchen cleaning, sofa cleaning	डीप क्लीनिंग, बाथरूम, किचन, सोफा क्लीनिंग	sparkles	chhota	2	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
7620bf00-771b-483d-8276-460841c37747	Electrician	इलेक्ट्रीशियन	electrician	Wiring, switchboard repair, fan installation, inverter setup	वायरिंग, स्विचबोर्ड रिपेयर, फैन इंस्टॉलेशन	zap	chhota	3	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
89655e31-e6b5-49ef-adf7-67d02a2fa06d	Plumber	प्लंबर	plumber	Tap repair, pipe fitting, drain cleaning, water tank installation	टैप रिपेयर, पाइप फिटिंग, नाली सफाई	droplets	chhota	4	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
c33ced62-00a3-4830-b654-0b4b16fb5633	Carpenter	कारपेंटर	carpenter	Furniture repair, door fitting, cupboard work, wood polishing	फर्नीचर रिपेयर, दरवाजा फिटिंग, अलमारी का काम	hammer	chhota	5	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
93a1bfd9-e35c-46b8-a508-29838be04faa	Salon at Home	घर पर सैलून	salon-at-home	Haircut, facial, waxing, makeup at your doorstep	हेयरकट, फेशियल, वैक्सिंग, मेकअप आपके घर पर	scissors	chhota	6	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
dd0f8aeb-77c1-431d-befa-1911ab4d0233	Pest Control	पेस्ट कंट्रोल	pest-control	Cockroach, termite, bed bug, mosquito treatment	कॉकरोच, दीमक, खटमल, मच्छर उपचार	bug	chhota	7	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
d08dd0e5-b23f-4cd6-8b79-431d96cce01c	Painting	पेंटिंग	painting-service	Wall painting, waterproofing, texture painting, POP work	वॉल पेंटिंग, वॉटरप्रूफिंग, टेक्सचर पेंटिंग	paintbrush	chhota	8	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
4bb2f1b2-cc28-4063-aa8c-8d11b80bd1ec	Home Construction	घर का निर्माण	home-construction	Complete house construction from foundation to finishing	नींव से लेकर फिनिशिंग तक पूरा मकान निर्माण	building	bada	1	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
42d947b6-c4bd-44c3-be9d-d2b69c633ce5	Home Renovation	घर का रेनोवेशन	home-renovation	Kitchen remodel, bathroom renovation, room extension	किचन रीमॉडल, बाथरूम रेनोवेशन, कमरा एक्सटेंशन	wrench	bada	2	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
943a64b8-ad7e-41c1-ba7b-d750269da1f3	Interior Design	इंटीरियर डिज़ाइन	interior-design	Modular kitchen, false ceiling, furniture design, decor	मॉड्यूलर किचन, फॉल्स सीलिंग, फर्नीचर डिज़ाइन	palette	bada	3	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
1d5db674-926c-4bf3-9bca-65891436aa70	Commercial Projects	कमर्शियल प्रोजेक्ट्स	commercial-projects	Office construction, shop interiors, warehouse setup	ऑफिस निर्माण, दुकान इंटीरियर, वेयरहाउस सेटअप	landmark	bada	4	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
11742dc6-2c6c-4155-9eed-2a956e92b873	Electrical Overhaul	इलेक्ट्रिकल ओवरहॉल	electrical-overhaul	Complete rewiring, panel upgrade, industrial electrical work	पूरी वायरिंग बदलना, पैनल अपग्रेड	cable	bada	5	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
e1b841ad-da1b-406e-a99d-d15b16b77277	Plumbing Overhaul	प्लंबिंग ओवरहॉल	plumbing-overhaul	Complete plumbing renovation, water tank, drainage system	पूरी प्लंबिंग रेनोवेशन, पानी की टंकी, ड्रेनेज सिस्टम	pipette	bada	6	t	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
\.


--
-- Data for Name: service_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_requests (id, service_id, category_id, user_id, customer_name, customer_phone, customer_address, preferred_date, preferred_time, notes, status, type, created_at, updated_at) FROM stdin;
80a9fd6b-dff9-476a-ac10-32b178179670	7ebe6ff9-020c-493b-940b-b9fad4d588e8	a2749b64-4229-44f3-8566-4d5185296e7c	5edfaaaf-bd86-438c-ab56-95f77ff9f98f	Alok Kumar	8303959728	Ramchandra Niwas, Manphool Nagla	2026-04-22	morning	\N	pending	chhota	2026-04-17 16:26:09.60915+05:30	2026-04-17 16:26:09.60915+05:30
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services (id, category_id, name, name_hi, slug, description, description_hi, price_starts_at, price_label, image_url, icon, rating, bookings_count, is_active, display_order, created_at, updated_at) FROM stdin;
e3a3840e-3c41-4ce1-8e49-c9383c67de36	a2749b64-4229-44f3-8566-4d5185296e7c	Refrigerator Repair	फ्रिज रिपेयर	fridge-repair	Cooling issue, gas leak, thermostat repair	कूलिंग प्रॉब्लेम, गैस लीक, थर्मोस्टेट रिपेयर	349	Starting at	\N	thermometer	4.50	0	t	2	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
20aa3628-1ed4-4bc4-a27a-4bfd6ca90e0c	a2749b64-4229-44f3-8566-4d5185296e7c	Washing Machine Repair	वॉशिंग मशीन रिपेयर	washing-machine-repair	Drum issue, drainage, motor repair	ड्रम प्रॉब्लेम, ड्रेनेज, मोटर रिपेयर	399	Starting at	\N	loader	4.50	0	t	3	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
174cf10e-71e8-427d-9255-57d7c94cc44a	a2749b64-4229-44f3-8566-4d5185296e7c	RO/Water Purifier Service	RO/वॉटर प्यूरीफायर सर्विस	ro-water-purifier	Filter change, membrane replacement, UV lamp	फिल्टर बदलना, मेम्ब्रेन बदलना	299	Starting at	\N	droplet	4.50	0	t	4	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
a9af1be9-5884-4ba8-acf3-d5ed183cedc2	55869b5b-5bf6-45e5-af2e-3d4a863396b2	Full Home Deep Cleaning	पूरे घर की डीप क्लीनिंग	full-home-cleaning	2BHK/3BHK complete deep cleaning with steam	2BHK/3BHK पूरी डीप क्लीनिंग	1999	Starting at	\N	home	4.50	0	t	1	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
9ac37e91-86ae-4c91-b8b2-6e616ac98fd1	55869b5b-5bf6-45e5-af2e-3d4a863396b2	Bathroom Cleaning	बाथरूम क्लीनिंग	bathroom-cleaning	Tile scrubbing, descaling, disinfection	टाइल स्क्रबिंग, डीस्केलिंग	499	Starting at	\N	bath	4.50	0	t	2	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
f7ab2c2c-f383-4970-86b6-e297144168a4	55869b5b-5bf6-45e5-af2e-3d4a863396b2	Kitchen Deep Cleaning	किचन डीप क्लीनिंग	kitchen-cleaning	Chimney, gas stove, cabinet, floor cleaning	चिमनी, गैस स्टोव, कैबिनेट, फ्लोर क्लीनिंग	899	Starting at	\N	chefHat	4.50	0	t	3	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
0e91d51a-846c-4e3c-91af-4432eb0bed39	55869b5b-5bf6-45e5-af2e-3d4a863396b2	Sofa & Carpet Cleaning	सोफा और कार्पेट क्लीनिंग	sofa-carpet-cleaning	Steam cleaning, stain removal, deodorizing	स्टीम क्लीनिंग, दाग हटाना	599	Starting at	\N	sofa	4.50	0	t	4	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
0aef621c-e1d0-4912-be99-a6376cb55478	7620bf00-771b-483d-8276-460841c37747	Fan Installation & Repair	फैन लगाना और रिपेयर	fan-install-repair	Ceiling fan, exhaust fan installation or repair	सीलिंग फैन, एग्जॉस्ट फैन लगाना या रिपेयर	199	Starting at	\N	fan	4.50	0	t	1	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
2298d072-895f-4325-bd99-f50751e9e20c	7620bf00-771b-483d-8276-460841c37747	Switchboard & Wiring	स्विचबोर्ड और वायरिंग	switchboard-wiring	New switchboard, wiring repair, MCB installation	नया स्विचबोर्ड, वायरिंग रिपेयर	249	Starting at	\N	toggleRight	4.50	0	t	2	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
c28430ea-da1e-4e74-ac51-8bf16c23faa5	7620bf00-771b-483d-8276-460841c37747	Inverter & Battery Setup	इनवर्टर और बैटरी सेटअप	inverter-battery	New inverter installation, battery replacement	नया इनवर्टर लगाना, बैटरी बदलना	499	Starting at	\N	battery	4.50	0	t	3	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
bdcda217-1670-4641-b87c-ce806f2a49d1	89655e31-e6b5-49ef-adf7-67d02a2fa06d	Tap & Mixer Repair	टैप और मिक्सर रिपेयर	tap-mixer-repair	Leaking tap, mixer installation, water flow fix	टैप लीक, मिक्सर लगाना	149	Starting at	\N	droplets	4.50	0	t	1	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
c29d7081-b684-4b7c-a267-87d1d012b5fc	89655e31-e6b5-49ef-adf7-67d02a2fa06d	Drain & Pipe Cleaning	नाली और पाइप सफाई	drain-pipe-cleaning	Blocked drain, pipe cleaning, sewage fix	बंद नाली, पाइप सफाई	299	Starting at	\N	pipette	4.50	0	t	2	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
1066e3d9-2444-4088-8e30-f1af745af3c4	89655e31-e6b5-49ef-adf7-67d02a2fa06d	Water Tank Installation	वॉटर टैंक इंस्टॉलेशन	water-tank-install	Overhead or underground tank setup	ऊपरी या अंडरग्राउंड टैंक सेटअप	999	Starting at	\N	container	4.50	0	t	3	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
cb5cd1bd-68ac-4e6c-b376-45fab11c6436	c33ced62-00a3-4830-b654-0b4b16fb5633	Door & Window Repair	दरवाजा और खिड़की रिपेयर	door-window-repair	Hinge fix, lock repair, frame adjustment	कब्ज़ा ठीक करना, ताला रिपेयर	249	Starting at	\N	door	4.50	0	t	1	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
4ec94875-e8ff-4101-adb1-4458e6fe4b9a	c33ced62-00a3-4830-b654-0b4b16fb5633	Furniture Assembly	फर्नीचर असेंबली	furniture-assembly	Bed, wardrobe, table assembly and disassembly	बेड, अलमारी, टेबल लगाना और खोलना	349	Starting at	\N	armchair	4.50	0	t	2	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
dc45b10b-4353-4461-9fa9-53fca1d7c4d5	c33ced62-00a3-4830-b654-0b4b16fb5633	Custom Woodwork	कस्टम वुडवर्क	custom-woodwork	Custom shelves, cabinets, wooden partitions	कस्टम शेल्फ, कैबिनेट, लकड़ी पार्टीशन	999	Starting at	\N	trees	4.50	0	t	3	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
4fa4cadf-4e0c-45ab-b63e-fc079d7c7142	93a1bfd9-e35c-46b8-a508-29838be04faa	Haircut for Men	पुरुषों के लिए हेयरकट	haircut-men	Professional haircut at home	घर बैठे प्रोफेशनल हेयरकट	199	Starting at	\N	scissors	4.50	0	t	1	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
60e605e0-ca17-4ebc-b6f4-48669da088c4	93a1bfd9-e35c-46b8-a508-29838be04faa	Facial & Cleanup	फेशियल और क्लीनअप	facial-cleanup	Gold facial, fruit facial, deep cleansing	गोल्ड फेशियल, फ्रूट फेशियल	399	Starting at	\N	sparkles	4.50	0	t	2	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
aa158d85-59d1-4c3c-8cf8-1d7af7b37ed3	93a1bfd9-e35c-46b8-a508-29838be04faa	Full Body Waxing	फुल बॉडी वैक्सिंग	full-body-waxing	Arms, legs, underarms, full body waxing	हाथ, पैर, अंडरआर्म्स, फुल बॉडी वैक्सिंग	599	Starting at	\N	star	4.50	0	t	3	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
8b967793-cdfc-48fa-a3e2-5ca463c467d2	dd0f8aeb-77c1-431d-befa-1911ab4d0233	Cockroach Treatment	कॉकरोच ट्रीटमेंट	cockroach-treatment	Gel treatment, spray treatment for cockroaches	जेल ट्रीटमेंट, स्प्रे ट्रीटमेंट	499	Starting at	\N	bug	4.50	0	t	1	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
2e08e5b1-8cdc-4f7b-bb92-837a49ac74ff	dd0f8aeb-77c1-431d-befa-1911ab4d0233	Termite Control	दीमक कंट्रोल	termite-control	Anti-termite treatment for home and furniture	घर और फर्नीचर के लिए एंटी-टर्माइट ट्रीटमेंट	1499	Starting at	\N	shield	4.50	0	t	2	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
100d7b9a-2302-47e5-8648-4fe08b11d7a9	dd0f8aeb-77c1-431d-befa-1911ab4d0233	Mosquito Treatment	मच्छर ट्रीटमेंट	mosquito-treatment	Fogging, larviciding for mosquito control	फॉगिंग, लार्विसाइडिंग	699	Starting at	\N	target	4.50	0	t	3	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
096fbc61-75ab-439a-a87f-d47d234fa4f5	d08dd0e5-b23f-4cd6-8b79-431d96cce01c	Room Painting	कमरे की पेंटिंग	room-painting	Single room wall painting with premium paint	एक कमरे की वॉल पेंटिंग	2499	Starting at	\N	paintbrush	4.50	0	t	1	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
328618c1-7387-4c5a-af23-92c96fb3229c	d08dd0e5-b23f-4cd6-8b79-431d96cce01c	Waterproofing	वॉटरप्रूफिंग	waterproofing	Terrace, bathroom, wall waterproofing	छत, बाथरूम, दीवार वॉटरप्रूफिंग	1999	Starting at	\N	umbrella	4.50	0	t	2	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
bc1f07f1-1e6f-448c-84b4-f901b12eff63	d08dd0e5-b23f-4cd6-8b79-431d96cce01c	Texture & POP Work	टेक्सचर और POP का काम	texture-pop-work	Designer wall texture, POP ceiling, wall panels	डिज़ाइनर वॉल टेक्सचर, POP सीलिंग	3499	Starting at	\N	layers	4.50	0	t	3	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
7ebe6ff9-020c-493b-940b-b9fad4d588e8	a2749b64-4229-44f3-8566-4d5185296e7c	AC Service & Repair	AC सर्विस और रिपेयर	ac-service-repair	Gas refill, filter cleaning, general servicing	गैस रिफिल, फिल्टर क्लीनिंग, सामान्य सर्विसिंग	499	Starting at	\N	wind	4.50	1	t	1	2026-03-04 21:51:23.640556+05:30	2026-03-04 21:51:23.640556+05:30
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, user_id, refresh_token, expires_at) FROM stdin;
51ef6640-b195-4241-a223-b204fde9f4ff	38d978f8-b6e3-4fa7-b6cc-badb6892beea	eb5b81a0ea65c33b1983acee71073dd58f04c2da524f997fb09c6c08b3b85fa7de55ad7bf8a4c3b3df974a375db75384	2026-05-08 16:03:57.777119+05:30
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_settings (key, value, updated_at) FROM stdin;
maintenance_mode	false	2026-03-03 11:00:22.986216
featured_limit	8	2026-03-03 11:00:22.989315
site_name	"Thekedaar"	2026-03-03 11:00:22.990654
support_email	"apkathekedaar@gmail.com"	2026-03-03 11:00:22.991219
support_phone	"+91 8303959728"	2026-03-03 11:00:22.993734
max_portfolio_photos	5	2026-03-03 11:00:22.997822
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, phone, password_hash, role, created_at, email, is_active, updated_at, location_lat, location_lng, location_accuracy_m, location_source, location_captured_at) FROM stdin;
88a4af69-6086-4f04-b19e-e25e3139916d	alok kumar	9207652007	$2b$10$KCcLVN5sbidq4Ahw8akoVeCL0q9SX.fjf17t06Cr5HHvvairxptkW	contractor	2026-02-28 10:17:25.354436+05:30	\N	t	2026-02-28 10:17:25.354436+05:30	\N	\N	\N	\N	\N
38d978f8-b6e3-4fa7-b6cc-badb6892beea	Administrator	0000000000	$2b$10$P2WPWyLbB5XH/w7rOG1OvuZFdd7HPtkNVnkKZuWAT2HgAhBgzahhe	admin	2026-02-28 11:03:15.858185+05:30	AditiSarang13@gmail.com	t	2026-02-28 11:03:15.858185+05:30	\N	\N	\N	\N	\N
cdac30e1-d51e-403a-81c3-ade8c0aca928	Divyanshi Rawat	7746854766	$2b$10$AzINgzBAsA0k6Sg/J26Q3Oc3fKwFt1i/u/7T0QkjfhflRrs16W1E.	customer	2026-02-28 23:00:43.347475+05:30	divyanshi@gmail.com	t	2026-02-28 23:00:43.347475+05:30	\N	\N	\N	\N	\N
c6db416c-fbb0-4da9-9eec-dcabd3706ecb	Kartik Singh	9935578033	$2b$10$n.z52ikDvyDBvnfj.jlMwOv97iYhcx66sJsXBgNNkI3H2HevEOE9e	contractor	2026-02-28 23:23:48.964246+05:30	\N	t	2026-02-28 23:23:48.964246+05:30	\N	\N	\N	\N	\N
5ea3e5e4-29ae-4cbb-8dc3-8842afc90157	Alok Kumar	9935694652	$2b$10$u4YqLVQEfOmZriD/Tho0ouX9z0mBwAPG3zliRuLWeRIc1s4BQBlcO	customer	2026-03-02 14:30:14.546453+05:30	papa432@gmail.com	t	2026-03-02 14:30:14.546453+05:30	\N	\N	\N	\N	\N
acd15477-69cf-4fc6-9437-c76abe0207b5	Divyanshu	9695320528	$2b$10$RmTuRPfPeU0/7x14aBqcW.dk7wAAgJFDOo0mvy4rckRJNjqbjUoCW	contractor	2026-03-02 14:36:52.547442+05:30	\N	t	2026-03-02 14:36:52.547442+05:30	\N	\N	\N	\N	\N
8c8c064e-e423-4d6a-9c7b-3a408e9e9b83	Vinod Kumar	9935578036	$2b$10$CqqWsHOnRnxyXw7w24.9W.Z/72Zq9.SjGdZcNViEcX6RJNpLexXo.	customer	2026-03-03 02:30:47.96987+05:30	papa@gmail.com	t	2026-03-03 02:32:07.20307+05:30	23.21027900	77.41051500	114.00	browser_gps	2026-03-03 02:32:07.20307+05:30
abe15967-9a1d-49ae-b065-399ed3e0ddf5	Aman Prajapati	9963548562	$2b$10$2mxvDBMku779Dcvpb2V.p.sgwvAMBikDaqVvIlRvI896sLtFafBou	contractor	2026-03-03 11:09:46.973813+05:30	\N	t	2026-03-03 11:09:46.973813+05:30	\N	\N	\N	\N	\N
9fd1dbba-d906-4d79-8b2e-b925a55fc4f0	dfasdf	9076520079	$2b$10$48I9Hsvtw7gWE8px0bx5yOaLxJulMEDa8.u.jkItroCZ8t61Qx2jm	contractor	2026-04-13 17:34:09.753163+05:30	\N	t	2026-04-16 12:08:21.62135+05:30	23.21027900	77.41051500	114.00	browser_gps	2026-04-16 12:08:21.62135+05:30
5edfaaaf-bd86-438c-ab56-95f77ff9f98f	Alok Kumar	8303959728	$2b$10$VzDlOGfgRX7uJGcBJJSvneEen0RLRBvT9OddTaDc3UROQ6G7r7uyC	customer	2026-02-28 10:14:26.081225+05:30	kumaralok27084@gmail.com	t	2026-04-17 16:39:04.856453+05:30	23.21028066	77.41045792	72.00	browser_gps	2026-04-17 16:39:04.856453+05:30
767ba075-0b5b-4231-88a5-a17d17ec4d9d	Shivang singh	9935578039	$2b$10$YaQsw4O1B/1bBamRJ4Jt/ey92fuVUW6qgfhMCIkrRSIERO8b6ORTW	contractor	2026-04-17 16:43:00.686042+05:30	\N	t	2026-04-17 16:43:22.085664+05:30	23.21028039	77.41044153	67.00	browser_gps	2026-04-17 16:43:22.085664+05:30
\.


--
-- Name: chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chats_id_seq', 2, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, true);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: chats chats_customer_id_contractor_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_customer_id_contractor_id_key UNIQUE (customer_id, contractor_id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: contractors contractors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractors
    ADD CONSTRAINT contractors_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: otps otps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.otps
    ADD CONSTRAINT otps_pkey PRIMARY KEY (id);


--
-- Name: password_resets password_resets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: payments payments_razorpay_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_razorpay_order_id_key UNIQUE (razorpay_order_id);


--
-- Name: payments payments_razorpay_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_razorpay_payment_id_key UNIQUE (razorpay_payment_id);


--
-- Name: portfolio_items portfolio_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_pkey PRIMARY KEY (id);


--
-- Name: profile_reviews profile_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_reviews
    ADD CONSTRAINT profile_reviews_pkey PRIMARY KEY (id);


--
-- Name: profile_reviews profile_reviews_profile_id_reviewer_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_reviews
    ADD CONSTRAINT profile_reviews_profile_id_reviewer_user_id_key UNIQUE (profile_id, reviewer_user_id);


--
-- Name: profiles profiles_handle_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_handle_key UNIQUE (handle);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);


--
-- Name: service_categories service_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_categories
    ADD CONSTRAINT service_categories_slug_key UNIQUE (slug);


--
-- Name: service_requests service_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: services services_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_slug_unique UNIQUE (slug);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_bookings_contractor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_contractor ON public.bookings USING btree (contractor_id);


--
-- Name: idx_bookings_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_customer ON public.bookings USING btree (customer_id);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_tier ON public.bookings USING btree (service_tier);


--
-- Name: idx_chats_contractor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chats_contractor ON public.chats USING btree (contractor_id);


--
-- Name: idx_chats_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chats_customer ON public.chats USING btree (customer_id);


--
-- Name: idx_contractors_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractors_category ON public.contractors USING btree (category);


--
-- Name: idx_contractors_featured; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractors_featured ON public.contractors USING btree (is_featured);


--
-- Name: idx_contractors_geo_earth; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractors_geo_earth ON public.contractors USING gist (public.ll_to_earth((COALESCE(lat, latitude))::double precision, (COALESCE(lng, longitude))::double precision)) WHERE ((COALESCE(lat, latitude) IS NOT NULL) AND (COALESCE(lng, longitude) IS NOT NULL));


--
-- Name: idx_contractors_lat_long; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractors_lat_long ON public.contractors USING btree (latitude, longitude);


--
-- Name: idx_contractors_rating_desc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractors_rating_desc ON public.contractors USING btree (rating DESC);


--
-- Name: idx_contractors_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractors_user ON public.contractors USING btree (user_id);


--
-- Name: idx_contractors_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contractors_verified ON public.contractors USING btree (is_verified);


--
-- Name: idx_messages_chat; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_chat ON public.messages USING btree (chat_id);


--
-- Name: idx_messages_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_created ON public.messages USING btree (created_at);


--
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- Name: idx_otps_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_otps_phone ON public.otps USING btree (phone);


--
-- Name: idx_payments_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_booking ON public.payments USING btree (booking_id);


--
-- Name: idx_portfolio_items_contractor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_items_contractor ON public.portfolio_items USING btree (contractor_id);


--
-- Name: idx_profile_reviews_profile_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profile_reviews_profile_id ON public.profile_reviews USING btree (profile_id);


--
-- Name: idx_profiles_geo_earth; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_profiles_geo_earth ON public.profiles USING gist (public.ll_to_earth((location_lat)::double precision, (location_lng)::double precision)) WHERE ((location_lat IS NOT NULL) AND (location_lng IS NOT NULL));


--
-- Name: idx_profiles_handle_lower; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_profiles_handle_lower ON public.profiles USING btree (lower((handle)::text));


--
-- Name: idx_reviews_contractor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_contractor ON public.reviews USING btree (contractor_id);


--
-- Name: idx_services_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_active ON public.services USING btree (is_active);


--
-- Name: idx_services_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_services_category ON public.services USING btree (category_id);


--
-- Name: idx_svc_cat_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_svc_cat_active ON public.service_categories USING btree (is_active);


--
-- Name: idx_svc_cat_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_svc_cat_type ON public.service_categories USING btree (type);


--
-- Name: idx_svc_req_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_svc_req_created ON public.service_requests USING btree (created_at DESC);


--
-- Name: idx_svc_req_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_svc_req_status ON public.service_requests USING btree (status);


--
-- Name: idx_users_location_lat_lng; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_location_lat_lng ON public.users USING btree (location_lat, location_lng);


--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_phone ON public.users USING btree (phone);


--
-- Name: bookings bookings_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chats chats_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE;


--
-- Name: chats chats_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: contractors contractors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contractors
    ADD CONSTRAINT contractors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_resets password_resets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_resets
    ADD CONSTRAINT password_resets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- Name: portfolio_items portfolio_items_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_items
    ADD CONSTRAINT portfolio_items_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE;


--
-- Name: profile_reviews profile_reviews_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_reviews
    ADD CONSTRAINT profile_reviews_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_reviews profile_reviews_reviewer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profile_reviews
    ADD CONSTRAINT profile_reviews_reviewer_user_id_fkey FOREIGN KEY (reviewer_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id);


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id);


--
-- Name: reviews reviews_contractor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_contractor_id_fkey FOREIGN KEY (contractor_id) REFERENCES public.contractors(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: service_requests service_requests_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id);


--
-- Name: service_requests service_requests_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id);


--
-- Name: service_requests service_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_requests
    ADD CONSTRAINT service_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: services services_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict IPpPGfTjeqe6PxJxzKNGjpjViC82gTGBjeCUXYgIoQ7GardIIcqIXuiZzIV2i8q

