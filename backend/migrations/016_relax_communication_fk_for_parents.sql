-- Migration 016: Relax foreign key constraints on communication to support parents table
ALTER TABLE public.communication DROP CONSTRAINT IF EXISTS communication_sender_id_fkey;
ALTER TABLE public.communication DROP CONSTRAINT IF EXISTS communication_receiver_id_fkey;

