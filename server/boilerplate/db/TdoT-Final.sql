--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_timestamp() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    adminid integer NOT NULL,
    userid integer NOT NULL,
    role character varying(50) DEFAULT 'admin'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- Name: admin_adminid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_adminid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_adminid_seq OWNER TO postgres;

--
-- Name: admin_adminid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_adminid_seq OWNED BY public.admin.adminid;


--
-- Name: aufgabe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aufgabe (
    aufgabeid integer NOT NULL,
    titel character varying(200) NOT NULL,
    beschreibung text,
    datum date NOT NULL,
    uhrzeit time without time zone,
    lehrerid integer,
    kategorie character varying(100),
    icon character varying(10),
    ziel_klassen text[] DEFAULT '{}'::text[]
);


ALTER TABLE public.aufgabe OWNER TO postgres;

--
-- Name: aufgabe_aufgabeid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.aufgabe_aufgabeid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.aufgabe_aufgabeid_seq OWNER TO postgres;

--
-- Name: aufgabe_aufgabeid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.aufgabe_aufgabeid_seq OWNED BY public.aufgabe.aufgabeid;


--
-- Name: lehrer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lehrer (
    lehrerid integer NOT NULL,
    name character varying(100) NOT NULL,
    fachbereich character varying(100)
);


ALTER TABLE public.lehrer OWNER TO postgres;

--
-- Name: lehrer_lehrerid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lehrer_lehrerid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lehrer_lehrerid_seq OWNER TO postgres;

--
-- Name: lehrer_lehrerid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lehrer_lehrerid_seq OWNED BY public.lehrer.lehrerid;


--
-- Name: schueler; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schueler (
    schuelerid integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255),
    klasse character varying(50),
    CONSTRAINT schueler_email_check CHECK (((email)::text ~~ '%@htlwienwest.at'::text))
);


ALTER TABLE public.schueler OWNER TO postgres;

--
-- Name: schueler_aufgabe; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schueler_aufgabe (
    schuelerid integer NOT NULL,
    aufgabeid integer NOT NULL
);


ALTER TABLE public.schueler_aufgabe OWNER TO postgres;

--
-- Name: schueler_aufgabe_anmeldung; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schueler_aufgabe_anmeldung (
    anmeldung_id integer NOT NULL,
    schueler_userid integer,
    aufgabeid integer,
    angemeldet_am timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'angemeldet'::character varying
);


ALTER TABLE public.schueler_aufgabe_anmeldung OWNER TO postgres;

--
-- Name: schueler_aufgabe_anmeldung_anmeldung_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schueler_aufgabe_anmeldung_anmeldung_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schueler_aufgabe_anmeldung_anmeldung_id_seq OWNER TO postgres;

--
-- Name: schueler_aufgabe_anmeldung_anmeldung_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schueler_aufgabe_anmeldung_anmeldung_id_seq OWNED BY public.schueler_aufgabe_anmeldung.anmeldung_id;


--
-- Name: schueler_schuelerid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.schueler_schuelerid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schueler_schuelerid_seq OWNER TO postgres;

--
-- Name: schueler_schuelerid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.schueler_schuelerid_seq OWNED BY public.schueler.schuelerid;


--
-- Name: user_account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_account (
    userid integer NOT NULL,
    email character varying(255) NOT NULL,
    name character varying(200),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    password_hash character varying(255),
    klasse character varying(50),
    lehrerid integer,
    email_verified boolean DEFAULT false,
    email_token text,
    email_token_expires timestamp without time zone,
    CONSTRAINT user_email_domain_check CHECK (((email)::text ~~ '%@htlwienwest.at'::text))
);


ALTER TABLE public.user_account OWNER TO postgres;

--
-- Name: user_account_userid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_account_userid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_account_userid_seq OWNER TO postgres;

--
-- Name: user_account_userid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_account_userid_seq OWNED BY public.user_account.userid;


--
-- Name: user_schueler_map; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_schueler_map (
    userid integer NOT NULL,
    schuelerid integer NOT NULL
);


ALTER TABLE public.user_schueler_map OWNER TO postgres;

--
-- Name: admin adminid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN adminid SET DEFAULT nextval('public.admin_adminid_seq'::regclass);


--
-- Name: aufgabe aufgabeid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aufgabe ALTER COLUMN aufgabeid SET DEFAULT nextval('public.aufgabe_aufgabeid_seq'::regclass);


--
-- Name: lehrer lehrerid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lehrer ALTER COLUMN lehrerid SET DEFAULT nextval('public.lehrer_lehrerid_seq'::regclass);


--
-- Name: schueler schuelerid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler ALTER COLUMN schuelerid SET DEFAULT nextval('public.schueler_schuelerid_seq'::regclass);


--
-- Name: schueler_aufgabe_anmeldung anmeldung_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler_aufgabe_anmeldung ALTER COLUMN anmeldung_id SET DEFAULT nextval('public.schueler_aufgabe_anmeldung_anmeldung_id_seq'::regclass);


--
-- Name: user_account userid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account ALTER COLUMN userid SET DEFAULT nextval('public.user_account_userid_seq'::regclass);


--
-- Data for Name: admin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin (adminid, userid, role, created_at) FROM stdin;
1	10	Super Admin	2026-01-08 19:51:18.461866+01
\.


--
-- Data for Name: aufgabe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aufgabe (aufgabeid, titel, beschreibung, datum, uhrzeit, lehrerid, kategorie, icon, ziel_klassen) FROM stdin;
1	Game Development Workshop	Stelle unsere Game Development Projekte vor und programmiere mit Besuchern einfache Spiele.	2024-11-15	09:00:00	\N	gamedev	🎮	{2ahit,2bhit,2chit,2afitn,2bfitn,3ahit,3bhit,3chit,3afitn,3bfitn}
2	IT-Sicherheit Präsentation	Zeige Grundlagen der IT-Sicherheit und erkläre wie man sich vor Cyberangriffen schützt.	2024-11-15	10:30:00	\N	it-sicherheit	🔒	{2ahit,2bhit,2chit,2afitn,2bfitn,3ahit,3bhit,3chit,3afitn,3bfitn}
3	Robotik Demonstration	Präsentiere unsere Roboter-Projekte und lasse Besucher selbst Roboter steuern.	2024-11-15	11:45:00	\N	robotik	🤖	{2ahit,2bhit,2chit,2afitn,2bfitn,3ahit,3bhit,3chit,3afitn,3bfitn}
4	Schulführung IT-Bereich	Führe Besucher durch die IT-Labore und zeige unsere technische Ausstattung.	2024-11-15	13:15:00	\N	fuehrung	🚶‍♂️	{2ahit,2bhit,2chit,2afitn,2bfitn,3ahit,3bhit,3chit,3afitn,3bfitn}
6	Green Screen Studio	Demonstriere Green Screen Aufnahmen und bearbeite Videos mit Spezialeffekten.	2024-11-15	11:00:00	\N	video	🎥	{4bhitm,4chitm}
7	Tonstudio Aufnahme	Zeige Aufnahmetechniken im Tonstudio und produziere mit Besuchern Audioaufnahmen.	2024-11-15	12:30:00	\N	audio	🎧	{4bhitm,4chitm}
8	3D Druck Labor	Präsentiere 3D-Modellierung und Druck mit unseren professionellen 3D-Druckern.	2024-11-15	14:00:00	\N	3d	🖨️	{4bhitm,4chitm}
9	Netzwerklabor Konfiguration	Konfiguriere Router und Switches und zeige Netzwerktopologien.	2024-11-15	09:00:00	\N	netzwerklabor	🌐	{4ahitn}
11	Cybersecurity Workshop	Zeige praktische IT-Sicherheitsmaßnahmen und Penetration Testing Grundlagen.	2024-11-15	12:15:00	\N	netzwerktechnik	🛡️	{4ahitn}
13	Web Development Live Coding	Programmiere live eine Webanwendung und zeige moderne Webtechnologien.	2024-11-15	11:15:00	\N	fachschule	🔧	{4afitn,4bfitn}
15	Diplomarbeit Präsentation HITN	Präsentation der Netzwerktechnik Diplomarbeit den ganzen Tag über.	2024-11-15	08:00:00	\N	diplomarbeit	🎓	{5ahitn}
16	Diplomarbeit Präsentation HITM	Präsentation der Medientechnik Diplomarbeit den ganzen Tag über.	2024-11-15	08:00:00	\N	diplomarbeit	🎬	{5bhitm,5chitm}
17	IT-Helpdesk Support	Biete technischen Support für Besucher und beantworte IT-Fragen.	2024-11-15	10:00:00	\N	support	💡	{2ahit,2bhit,2chit,3ahit,3bhit,3chit,4ahitn,4bhitm,4chitm,4afitn,4bfitn}
19	890u9	09u09u	2000-12-12	12:12:12	\N	\N	\N	{}
20	ijooijoij	uijij	1029-03-12	12:12:00	\N	\N	\N	{}
21	tftfyuyugyuggyuyug	yuggyugyugyuyug	2026-03-12	12:12:00	\N	\N	\N	{}
12	Fachschule IT Präsentation	Stelle die Schwerpunkte der Fachschule für Informationstechnologie vor.	2024-11-15	09:30:00	\N	fachschule	💻	{4afitn,4bfitn}
14	IT-Berufsberatung	Informiere über Berufschancen und Karrieremöglichkeiten in der IT-Branche.	2024-11-15	13:00:00	\N	fachschule	🎯	{4afitn,4bfitn}
10	Server Virtualisierung	Demonstriere Server-Virtualisierung mit VMware und Docker Containern.	2024-11-15	10:45:00	\N	serverraum	🖥️	{4ahitn}
5	Fotostudio Workshop	Betreue das Fotostudio und zeige professionelle Fototechniken mit DSLR-Kameras.	2024-11-15	09:30:00	\N	foto	📸	{4bhitm,4chitm}
22	Greenscreen Video Labor	blablabla	2026-12-02	14:00:00	\N	\N	\N	{}
23	Greenscreen	abc	2026-03-13	13:00:00	\N	\N	\N	{4BHITM}
\.


--
-- Data for Name: lehrer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lehrer (lehrerid, name, fachbereich) FROM stdin;
5	Richard Wurzer	Allgemein
\.


--
-- Data for Name: schueler; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schueler (schuelerid, name, email, klasse) FROM stdin;
\.


--
-- Data for Name: schueler_aufgabe; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schueler_aufgabe (schuelerid, aufgabeid) FROM stdin;
\.


--
-- Data for Name: schueler_aufgabe_anmeldung; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.schueler_aufgabe_anmeldung (anmeldung_id, schueler_userid, aufgabeid, angemeldet_am, status) FROM stdin;
6	33	6	2026-03-13 15:14:31.34155	angemeldet
7	32	6	2026-03-13 15:14:40.926927	angemeldet
8	31	6	2026-03-13 15:14:55.531163	angemeldet
\.


--
-- Data for Name: user_account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_account (userid, email, name, created_at, updated_at, password_hash, klasse, lehrerid, email_verified, email_token, email_token_expires) FROM stdin;
10	admin@htlwienwest.at	Admin	2025-11-08 00:18:55.356858+01	2026-01-22 21:04:34.273653+01	$2b$12$TU1BVzsXoGRHJtJa2LSI/u9dKcMD7b4eHxE8CE3EV9iAR4Qj/QgPi	Admin	\N	t	\N	\N
29	richard.wurzer@htlwienwest.at	Richard Wurzer	2026-03-13 14:33:34.190027+01	2026-03-13 14:33:34.199884+01	$2b$12$A78BQkeCbho1HTl/mzcaJuOCmh69v8EPU1ww9B5OshJmrJMQNMqTy	Lehrer	5	f	\N	\N
30	reinhart.s21@htlwienwest.at	Sven-Erik Reinhart	2026-03-13 14:36:48.614318+01	2026-03-13 14:37:04.989525+01	$2b$12$U29VXAKvmKOso9HTmUr2GubHtqbrKOHOMJ3T4vDoUamw5pOgD9wry	5BHITM	\N	f	\N	\N
31	tamim.b21@htlwienwest.at	Bashar Tamim	2026-03-13 14:39:10.112139+01	2026-03-13 14:39:25.33903+01	$2b$12$ps6jnfddcc1lyvVxDFWhnuJEShVU.QhUhh3.xSJ4M3SySlXTBdk/i	4BHITM	\N	f	\N	\N
32	kuzniak.m21@htlwienwest.at	Mateusz Kuzniak	2026-03-13 14:40:15.807496+01	2026-03-13 14:40:23.94738+01	$2b$12$h7v8VvpJmQaWAGcCjBkDfO011cPSfXh4ccaID/FQgEOy8apMRRAna	4BHITM	\N	f	\N	\N
33	harrer.r20@htlwienwest.at	Ricardo Harrer	2026-03-13 15:13:53.684217+01	2026-03-13 15:14:01.481366+01	$2b$12$ovYksrJWaPjNKpKAhdNHHO.zouzlyU.pdHRIqCmC67qgPBXx77ODC	4BHITM	\N	f	\N	\N
\.


--
-- Data for Name: user_schueler_map; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_schueler_map (userid, schuelerid) FROM stdin;
\.


--
-- Name: admin_adminid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_adminid_seq', 1, true);


--
-- Name: aufgabe_aufgabeid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.aufgabe_aufgabeid_seq', 23, true);


--
-- Name: lehrer_lehrerid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lehrer_lehrerid_seq', 5, true);


--
-- Name: schueler_aufgabe_anmeldung_anmeldung_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schueler_aufgabe_anmeldung_anmeldung_id_seq', 8, true);


--
-- Name: schueler_schuelerid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.schueler_schuelerid_seq', 1, false);


--
-- Name: user_account_userid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_account_userid_seq', 33, true);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (adminid);


--
-- Name: aufgabe aufgabe_lehrerid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aufgabe
    ADD CONSTRAINT aufgabe_lehrerid_key UNIQUE (lehrerid);


--
-- Name: aufgabe aufgabe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aufgabe
    ADD CONSTRAINT aufgabe_pkey PRIMARY KEY (aufgabeid);


--
-- Name: lehrer lehrer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lehrer
    ADD CONSTRAINT lehrer_pkey PRIMARY KEY (lehrerid);


--
-- Name: schueler_aufgabe_anmeldung schueler_aufgabe_anmeldung_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler_aufgabe_anmeldung
    ADD CONSTRAINT schueler_aufgabe_anmeldung_pkey PRIMARY KEY (anmeldung_id);


--
-- Name: schueler_aufgabe schueler_aufgabe_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler_aufgabe
    ADD CONSTRAINT schueler_aufgabe_pkey PRIMARY KEY (schuelerid, aufgabeid);


--
-- Name: schueler schueler_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler
    ADD CONSTRAINT schueler_email_key UNIQUE (email);


--
-- Name: schueler schueler_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler
    ADD CONSTRAINT schueler_pkey PRIMARY KEY (schuelerid);


--
-- Name: user_account user_account_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_email_key UNIQUE (email);


--
-- Name: user_account user_account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT user_account_pkey PRIMARY KEY (userid);


--
-- Name: user_schueler_map user_schueler_map_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_schueler_map
    ADD CONSTRAINT user_schueler_map_pkey PRIMARY KEY (userid, schuelerid);


--
-- Name: idx_admin_userid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_userid ON public.admin USING btree (userid);


--
-- Name: idx_aufgabe_kategorie; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_aufgabe_kategorie ON public.aufgabe USING btree (kategorie);


--
-- Name: idx_schueler_aufgabe; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schueler_aufgabe ON public.schueler_aufgabe_anmeldung USING btree (schueler_userid, aufgabeid);


--
-- Name: user_account trig_user_update_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trig_user_update_at BEFORE UPDATE ON public.user_account FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


--
-- Name: admin admin_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_userid_fkey FOREIGN KEY (userid) REFERENCES public.user_account(userid) ON DELETE CASCADE;


--
-- Name: aufgabe aufgabe_lehrerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aufgabe
    ADD CONSTRAINT aufgabe_lehrerid_fkey FOREIGN KEY (lehrerid) REFERENCES public.lehrer(lehrerid) ON DELETE SET NULL;


--
-- Name: user_account fk_user_lehrer; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_account
    ADD CONSTRAINT fk_user_lehrer FOREIGN KEY (lehrerid) REFERENCES public.lehrer(lehrerid);


--
-- Name: schueler_aufgabe_anmeldung schueler_aufgabe_anmeldung_aufgabeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler_aufgabe_anmeldung
    ADD CONSTRAINT schueler_aufgabe_anmeldung_aufgabeid_fkey FOREIGN KEY (aufgabeid) REFERENCES public.aufgabe(aufgabeid) ON DELETE CASCADE;


--
-- Name: schueler_aufgabe_anmeldung schueler_aufgabe_anmeldung_schueler_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler_aufgabe_anmeldung
    ADD CONSTRAINT schueler_aufgabe_anmeldung_schueler_userid_fkey FOREIGN KEY (schueler_userid) REFERENCES public.user_account(userid) ON DELETE CASCADE;


--
-- Name: schueler_aufgabe schueler_aufgabe_aufgabeid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler_aufgabe
    ADD CONSTRAINT schueler_aufgabe_aufgabeid_fkey FOREIGN KEY (aufgabeid) REFERENCES public.aufgabe(aufgabeid) ON DELETE CASCADE;


--
-- Name: schueler_aufgabe schueler_aufgabe_schuelerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schueler_aufgabe
    ADD CONSTRAINT schueler_aufgabe_schuelerid_fkey FOREIGN KEY (schuelerid) REFERENCES public.schueler(schuelerid) ON DELETE CASCADE;


--
-- Name: user_schueler_map user_schueler_map_schuelerid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_schueler_map
    ADD CONSTRAINT user_schueler_map_schuelerid_fkey FOREIGN KEY (schuelerid) REFERENCES public.schueler(schuelerid) ON DELETE CASCADE;


--
-- Name: user_schueler_map user_schueler_map_userid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_schueler_map
    ADD CONSTRAINT user_schueler_map_userid_fkey FOREIGN KEY (userid) REFERENCES public.user_account(userid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

