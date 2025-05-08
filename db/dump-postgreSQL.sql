-- PostgreSQL compatible version of the SQLite dump
BEGIN;

-- First create tables with DEFERRABLE constraints
-- Create "users" table first since it's referenced by other tables
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL NOT NULL UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "full_name" TEXT NOT NULL,
    "is_activated" BOOLEAN NOT NULL DEFAULT FALSE,
    "is_admin" INTEGER DEFAULT 0,
    "verification_token" TEXT,
    "password_hash" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id")
);

-- Next create "books" table as it's also referenced by other tables
CREATE TABLE IF NOT EXISTS "books" (
    "id" TEXT UNIQUE,
    "title" TEXT NOT NULL,
    "cover_image" TEXT NOT NULL,
    "publishing_date" TEXT NOT NULL,
    "summary" TEXT,
    "has_audio" BOOLEAN NOT NULL DEFAULT FALSE,
    "audio_length" INTEGER,
    "extract" TEXT,
    "rating" INTEGER,
    "is_visible" INTEGER DEFAULT 1,
    "is_preview" INTEGER,
    "display_order" INTEGER,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id")
);

-- Create audiobooks table with deferrable constraints
CREATE TABLE IF NOT EXISTS "audiobooks" (
    "id" SERIAL NOT NULL UNIQUE,
    "book_id" TEXT NOT NULL,
    "media_id" TEXT,
    "audio_length" INTEGER,
    "publishing_date" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id"),
    FOREIGN KEY("book_id") REFERENCES "books"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "user_stats" (
    "user_id" INTEGER NOT NULL,
    "total_books_read" INTEGER NOT NULL DEFAULT 0,
    "total_reading_time" INTEGER NOT NULL DEFAULT 0,
    "total_audio_time" INTEGER NOT NULL DEFAULT 0,
    "completed_books" INTEGER NOT NULL DEFAULT 0,
    "reading_streak" INTEGER NOT NULL DEFAULT 0,
    "last_read_date" TEXT,
    PRIMARY KEY("user_id"),
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "audio_sessions" (
    "id" SERIAL NOT NULL UNIQUE,
    "user_id" INTEGER NOT NULL,
    "book_id" TEXT NOT NULL,
    "start_time" INTEGER NOT NULL,
    "end_time" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY("book_id") REFERENCES "books"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "book_progress" (
    "book_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "current_page" INTEGER,
    "current_time" INTEGER,
    "progress" REAL NOT NULL DEFAULT 0,
    "last_read_date" TEXT,
    "status" TEXT,
    PRIMARY KEY("book_id","user_id"),
    FOREIGN KEY("book_id") REFERENCES "books"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "bookmarks" (
    "id" SERIAL NOT NULL UNIQUE,
    "book_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "page" INTEGER,
    "time" INTEGER,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id"),
    FOREIGN KEY("book_id") REFERENCES "books"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "notes" (
    "id" SERIAL NOT NULL UNIQUE,
    "book_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id"),
    FOREIGN KEY("book_id") REFERENCES "books"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "reading_sessions" (
    "id" SERIAL NOT NULL UNIQUE,
    "user_id" INTEGER NOT NULL,
    "book_id" TEXT NOT NULL,
    "start_page" INTEGER NOT NULL,
    "end_page" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY("book_id") REFERENCES "books"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "user_preferences" (
    "user_id" INTEGER NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "view_mode" TEXT NOT NULL DEFAULT 'grid',
    "email_new_releases" BOOLEAN NOT NULL DEFAULT TRUE,
    "email_reading_reminders" BOOLEAN NOT NULL DEFAULT TRUE,
    "email_recommendations" BOOLEAN NOT NULL DEFAULT TRUE,
    "reduce_animations" BOOLEAN NOT NULL DEFAULT FALSE,
    "high_contrast" BOOLEAN NOT NULL DEFAULT FALSE,
    "large_text" BOOLEAN NOT NULL DEFAULT FALSE,
    "font_size" TEXT NOT NULL DEFAULT 'medium',
    "line_spacing" TEXT NOT NULL DEFAULT 'normal',
    "font_family" TEXT NOT NULL DEFAULT 'inter',
    PRIMARY KEY("user_id"),
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL UNIQUE,
    "book_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    "is_admin" INTEGER DEFAULT 0,
    "content" TEXT NOT NULL,
    "parent_id" TEXT,
    "created_at" TEXT NOT NULL,
    PRIMARY KEY("id"),
    FOREIGN KEY("book_id") REFERENCES "books"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED,
    FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

-- Defer constraints for data loading
SET CONSTRAINTS ALL DEFERRED;

-- Insert data in the proper order (respecting dependencies)
-- First insert users data
INSERT INTO users VALUES(1,'oscar@omaa.it','Oscar',TRUE,1,NULL,'b697ef5cd1394f3fea1aba6734da14df4dfe42ed793cc6fb46c7db67926bc51f','2025-04-08 14:18:31','2025-04-08 14:28:50');
INSERT INTO users VALUES(2,'teamtools@gmail.com','Piero Carbonetti',TRUE,0,NULL,'69014de69d9400c2b98e32e7e625eee7b091ce5907e4aca7c26341e5e9e50b5f','2025-05-05 15:21:58','2025-05-05 15:22:08');

-- Insert all books data before audiobooks
INSERT INTO books VALUES('book-1741139883301','Suor Turchese','1.jpg','2025-03-05T01:57:05.620Z',NULL,FALSE,NULL,E'Suor Turchese seduta su di uno scranno tambureggia nervosamente le dita sul salterio, con un piede batte ritmicamente il pavimento: è preda dell''ansia, il suo corpo lancia evidenti segnali non verbali, tutti provocati da uno stato d''animo che esprime impazienza per quella snervante attesa.',NULL,1,NULL,2,'2025-03-05 01:58:03','2025-03-05 01:58:03');
INSERT INTO books VALUES('book-1741140599986','Centodieci per cento','2.jpg','2025-03-05T02:08:35.197Z',NULL,FALSE,NULL,NULL,NULL,0,NULL,100,'2025-03-05 02:09:59','2025-03-05 02:09:59');
INSERT INTO books VALUES('book-1741140635247','La Maison du Plaisir (Romanzo di Ricette)','3.jpg','2025-03-05T02:10:13.424Z',NULL,FALSE,NULL,E'Per chi, come me, ama fortemente la tavola imbandita ma non\npratica l''arte della cucina, la storia di Roberto Raimondi apre l''appetito della conoscenza culinaria, intesa non solo come capacità\ndi preparare piatti e pietanze, ma come cultura che attraversa\nspazi, persone, esperienze di vita.',NULL,1,NULL,11,'2025-03-05 02:10:35','2025-03-05 02:10:35');
INSERT INTO books VALUES('book-1741140662641','C''è sempre una prima volta','4.jpg','2025-03-05T02:10:43.041Z',NULL,FALSE,NULL,E'È l''alba di un nuovo giorno, per qualcuno un giorno speciale da conservare per sempre nel cassetto della memoria dei ricordi. Un sole implacabile comincia a dardeggiare sotto un cielo limpido privo di nuvole. Siamo nel periodo più caldo dell''estate: "I giorni del cane", un lasso di tempo tra i più temuti per via dell''alto tasso di umidità nell''aria, la completa assenza di alcun vento aumenta la percezione di calore, che va ben oltre ai trentacinque gradi centigradi.',NULL,1,NULL,3,'2025-03-05 02:11:02','2025-03-05 02:11:02');
INSERT INTO books VALUES('book-1741140692011','L''artista ...di Busto Garolfo','5.jpg','2025-03-05T02:11:08.168Z','',TRUE,732,E'A Busto Garolfo oggi è il quindici agosto, e il piccolo paese alle porte di Milano è desolatamente vuoto, tanto da sembrare abbandonato come un sacco privo del suo contenuto. Lasciato nella solitudine è inesorabilmente esposto al sole che tutto surriscalda, le strade accumulano calore, le piazze diventano deserti di asfalto e cemento attorno a mucchi di case, scheletri di mattoni lasciati incustoditi a quella preannunciata giornata di fuoco.',NULL,1,NULL,4,'2025-03-05 02:11:32','2025-05-05 01:28:38');
INSERT INTO books VALUES('book-1741140716949','sotto sotto','6.jpg','2025-03-05T02:11:35.974Z',NULL,TRUE,1368,E'Pasquale Zulli, il maresciallo a piedi comandante della stazione dei carabinieri di Francavilla al Mare era stato chiamato in contrada Villa Ca-prino e, accertati i fatti li aveva presi in consegna accompagnati in caserma a calci in culo, e rinchiusi nella camera di sicurezza, nell''attesa di fare luce su quanto accaduto, poi scuotendo la testa con fare preoccupato era nuova-mente uscito immergendosi nel caldo soffocate che preannunciava una giornata rovente in tutti i sensi, lasciando i tre ragazzi nella solitudine del-lo spazio di quelle pareti ammuffite e puzzolenti.',NULL,1,NULL,1,'2025-03-05 02:11:56','2025-03-05 02:11:56');
INSERT INTO books VALUES('book-1741140840530','La notte dello samhain','7.jpg','2025-03-05T02:13:41.230Z',NULL,FALSE,NULL,NULL,NULL,0,NULL,101,'2025-03-05 02:14:00','2025-03-05 02:14:00');
INSERT INTO books VALUES('book-1741140876292','Beatam vitam laetitiamgue','8.jpg','2025-03-05T02:14:06.376Z',NULL,FALSE,NULL,E'Era stata una mattinata molto intensa, alzatosi di buon''ora, dopo una frugale e veloce colazione si era recato ad Olcella, dove aveva in-contrato i volontari responsabili del bar dell''oratorio, insieme avevano atteso l''arrivo di due nuovi biliardini, elementi ludici ritenuti necessa-ri per svecchiare l''aria dal sapore di briscola e scopa, che da tempo si respirava tra quelle mura. Subito dopo, sempre nella piccola frazione, era andato a casa di Corrado Bertoglio',NULL,1,NULL,6,'2025-03-05 02:14:36','2025-03-12 16:12:06');
INSERT INTO books VALUES('book-1741140905177','La magia del Natale raccontata da un Angelo','L''Angelo-di-Natale.jpg','2025-03-05T02:14:39.665Z',NULL,FALSE,NULL,E'Se si osserva con la giusta lente l''iconografia religiosa si può tranquil-lamente dire che i soggetti più rappresentati: per dimostrare la gloria di Dio, sono indubbiamente gli angeli. In ogni città quadri e sculture, raffigu-ranti angeli custodi, adornano chiese e musei, simboli mostrati al pubblico come meravigliose creature che stanno tra l''umano e il divino.',NULL,1,NULL,7,'2025-03-05 02:15:05','2025-05-04 01:46:43');
INSERT INTO books VALUES('book-1741140927764','Il volo di Ecru','10.jpg','2025-03-05T02:15:08.572Z',NULL,FALSE,NULL,NULL,NULL,0,NULL,103,'2025-03-05 02:15:27','2025-03-05 02:15:27');
INSERT INTO books VALUES('book-1741140966369','Cettina - Il miracolo di Francavilla al Mare','11.jpg','2025-03-05T02:15:31.082Z','',TRUE,635,E'Eccellenza reverendissima, v''invio questa missiva per portare alla vostra illu-strissima conoscenza un fatto miracoloso accaduto nei giorni scorsi a Francavilla al Mare in contrada Porta Nuova, circostanza cui il buon Dio ha voluto che io ne fossi partecipe e testimone.',NULL,1,NULL,5,'2025-03-05 02:16:06','2025-05-05 01:30:34');
INSERT INTO books VALUES('book-1741141002929','Veronica di Gerusalemme - sesta stazione','12.jpg','2025-03-05T02:16:15.302Z',NULL,FALSE,NULL,E'A Gerusalemme oggi non è un giorno come gli altri, nell''aria si re-spira curiosità mista a tensione, le emozioni di un evento straordinario ha radunato in città molte persone già dalle prime luci dell''alba, con im-paziente desiderio si preparano ad assistere al passaggio del condanna-to, colui che si è proclamato Figlio di Dio.',NULL,1,NULL,8,'2025-03-05 02:16:42','2025-03-05 02:16:42');
INSERT INTO books VALUES('book-1741141023787','Vivere per sempre','13.jpg','2025-03-05T02:16:48.525Z',NULL,FALSE,NULL,E'Nella mia vita sono sempre stato una persona pacata ed estremamen-te equilibrata, capace in ogni occasione di saper valutare bene situazioni e persone affinché entrambe mi potessero dare più beneficio che danno, e questo: sia dal punto di vista fisico che da quello psichico.',NULL,1,NULL,10,'2025-03-05 02:17:03','2025-03-05 02:17:03');
INSERT INTO books VALUES('book-1741141044322','Il Conte Bassetti','Copertina Il Conte Bassetti.jpg','2025-03-05T02:17:07.647Z',NULL,FALSE,NULL,E'Il maresciallo comandante della stazione dei carabinieri di Parabiago è in compagnia del pari grado di Busto Garolfo, erano intervenuti nell''abitato di Ravello, dopo una segnalazione fatta dai Vigili del Fuoco della caserma di Legnano, allertati a loro volta dagli abitanti della zona, per la fuori uscita di fumo dall''interno di una villa.',NULL,1,NULL,9,'2025-03-05 02:17:24','2025-03-05 02:17:24');
INSERT INTO books VALUES('book-1741141098772','Le uova di Colombo','15.jpg','2025-03-05T02:17:58.318Z',NULL,FALSE,NULL,E'A rassicurarlo era stato vedere il pollice alzato di don Berino, a quella benevole vista, con un sospiro di sollievo ogni muscolo del corpo si era completamente rilassato, il potenziale pericolo sembrava scongiurato, era-no stati minuti interminabili che gli avevano causato ansia e palpitazione. ',NULL,1,NULL,14,'2025-03-05 02:18:18','2025-05-04 14:56:03');
INSERT INTO books VALUES('book-1741141117215','Il segreto dell''Ottico','Il-segreto-dell''ottico.jpg','2025-03-05T02:18:20.964Z',NULL,FALSE,NULL,E'Quella che si presenta è una fredda mattina. Un velo di brina ricopre di un gelido sudario i tetti delle case di tutto il paese. Per le strade si respi-ra un''atmosfera ovattata dall''aria umida, un cielo grigio e plumbeo cancel-la dalla visuale ogni prospettiva. Il timido sole reticente di questo periodo dell''anno sembra non volere mai salire sopra l''orizzonte.',NULL,1,NULL,15,'2025-03-05 02:18:37','2025-05-04 01:41:20');
INSERT INTO books VALUES('book-1744086130891','Vicolo Gesù - La casa dei sogni','copertina Vicolo Gesù.jpg','2025-04-08T04:20:42.686Z',NULL,FALSE,NULL,E'Sono nata a Busto Garolfo nel millenovecentosettantadue, fin da bambina ho osservato lo scorrere della vita stando dietro i vetri di una finestra in una soffitta di un''antica casa in sasso, un''abitazione indipendente a più livelli situata in vicolo Gesù al civico due, un tratto stradale senza via d''uscita schiacciato da entrambi i lati dal peso di vecchie case a cortile.',NULL,1,NULL,13,'2025-04-08 04:22:10','2025-04-08 04:22:10');
INSERT INTO books VALUES('book-1744086675366','Nel regno dell''uroboro','Copertina Nel regno dell''uroboro.jpg','2025-04-08T04:30:32.147Z',NULL,FALSE,NULL,E'Passo buona parte della mia esistenza nella continua ricerca di come sconfiggere la noia. L''arte dell''indagare, per trovare gli stimoli giusti, oramai è diventato un lavoro aggiuntivo, rispetto a quello che mi è stato assegnato.',NULL,1,NULL,12,'2025-04-08 04:31:15','2025-04-08 04:31:15');
INSERT INTO books VALUES('book-1744087756038','Il Mistero del Dipinto','Il Mistero del Dipinto.jpg','2025-04-08T04:49:02.904Z',NULL,FALSE,NULL,NULL,NULL,1,1,200,'2025-04-08 04:49:16','2025-04-08 04:49:16');
INSERT INTO books VALUES('book-1746324080859','La Ragazza del Carillon','copertina la ragazza.jpg','2025-05-04T02:00:42.865Z',NULL,FALSE,NULL,NULL,NULL,1,1,201,'2025-05-04 02:01:20','2025-05-04 02:01:20');
INSERT INTO books VALUES('book-1746388106-5','L''artista ...di Busto Garolfo','5.jpg','2025-03-05T02:11:08.168Z',NULL,FALSE,NULL,E'A Busto Garolfo oggi è il quindici agosto, e il piccolo paese alle porte di Milano è desolatamente vuoto, tanto da sembrare abbandonato come un sacco privo del suo contenuto. Lasciato nella solitudine è inesorabilmente esposto al sole che tutto surriscalda, le strade accumulano calore, le piazze diventano deserti di asfalto e cemento attorno a mucchi di case, scheletri di mattoni lasciati incustoditi a quella preannunciata giornata di fuoco.',NULL,1,NULL,4,'2025-05-04 19:48:26','2025-05-04 19:48:26');
INSERT INTO books VALUES('book-1746388106-6','sotto sotto','6.jpg','2025-03-05T02:11:35.974Z',NULL,FALSE,NULL,E'Pasquale Zulli, il maresciallo a piedi comandante della stazione dei carabinieri di Francavilla al Mare era stato chiamato in contrada Villa Ca-prino e, accertati i fatti li aveva presi in consegna accompagnati in caserma a calci in culo, e rinchiusi nella camera di sicurezza, nell''attesa di fare luce su quanto accaduto, poi scuotendo la testa con fare preoccupato era nuova-mente uscito immergendosi nel caldo soffocate che preannunciava una giornata rovente in tutti i sensi, lasciando i tre ragazzi nella solitudine del-lo spazio di quelle pareti ammuffite e puzzolenti.',NULL,1,NULL,1,'2025-05-04 19:48:26','2025-05-04 19:48:26');
INSERT INTO books VALUES('book-1746388106-11','Cettina - Il miracolo di Francavilla al Mare','11.jpg','2025-03-05T02:15:31.082Z',NULL,FALSE,NULL,E'Eccellenza reverendissima, v''invio questa missiva per portare alla vostra illu-strissima conoscenza un fatto miracoloso accaduto nei giorni scorsi a Francavilla al Mare in contrada Porta Nuova, circostanza cui il buon Dio ha voluto che io ne fossi partecipe e testimone.',NULL,1,NULL,5,'2025-05-04 19:48:26','2025-05-04 19:48:26');

-- Now insert audiobooks data after books
INSERT INTO audiobooks VALUES(1,'book-1741140716949','sotto sotto.mp4',1368,'2025','2025-03-12 02:56:36','2025-03-12 02:56:50');
INSERT INTO audiobooks VALUES(2,'book-1741140966369','Cettina.mp4',NULL,NULL,'2025-04-08 06:02:54','2025-04-08 06:02:54');
INSERT INTO audiobooks VALUES(3,'book-1741140692011','L''artista di Busto Garolfo.mp4',NULL,NULL,'2025-04-08 06:03:58','2025-04-08 06:03:58');
INSERT INTO audiobooks VALUES(4,'book-1741141044322','Copertina Il Conte Bassetti.jpg',NULL,NULL,'2025-04-08 07:55:34','2025-04-08 07:55:34');

-- Insert comments data
INSERT INTO comments VALUES('08a61f31-897c-408f-9cee-584b7b7d7e5f','book-1741140716949',1,'Oscar',0,'Message 2 Level 0',NULL,'2025-04-18T02:05:25.725Z');
INSERT INTO comments VALUES('9bc9bebd-ac7e-41a4-af2a-40c4b90805c2','book-1741140716949',1,'Oscar',0,'Message 1 Level 0',NULL,'2025-04-18T02:05:36.927Z');
INSERT INTO comments VALUES('1a823a9d-0177-48d6-98dd-536bdf9da6be','book-1741140716949',1,'Oscar',1,'Message 1 Level 1','9bc9bebd-ac7e-41a4-af2a-40c4b90805c2','2025-04-18T02:05:50.717Z');
INSERT INTO comments VALUES('10cf06a8-4ed6-4c8c-8cfe-3315e9dce60f','book-1741140716949',1,'Oscar',0,'Message 1 Level 2','1a823a9d-0177-48d6-98dd-536bdf9da6be','2025-04-18T02:06:08.918Z');
INSERT INTO comments VALUES('1730c64a-920b-424b-9f8e-fe3e3465c304','book-1741140716949',1,'Oscar',1,'Message 1 Level 1b','1a823a9d-0177-48d6-98dd-536bdf9da6be','2025-04-22T20:29:50.975Z');
INSERT INTO comments VALUES('42152271-76b0-419a-983d-e421a7737487','book-1741140716949',1,'Oscar',1,'Message 1 Level 3','10cf06a8-4ed6-4c8c-8cfe-3315e9dce60f','2025-04-22T20:35:24.131Z');
INSERT INTO comments VALUES('089bd1b6-f7bd-4b44-b2b9-bfde7ae2ab64','book-1741140716949',1,'Oscar',1,'Message 1 Lv2 ciao','1a823a9d-0177-48d6-98dd-536bdf9da6be','2025-04-22T20:37:03.333Z');
INSERT INTO comments VALUES('4acf7515-6325-49ea-89f2-341e5a91bac1','book-1741140716949',1,'Oscar',1,'Message 1 Lv2 altra risposta','1a823a9d-0177-48d6-98dd-536bdf9da6be','2025-04-22T20:47:01.022Z');
INSERT INTO comments VALUES('bcc3c7e0-0a35-4d23-beba-c85934b4062a','book-1741140716949',1,'Oscar',1,'Message 3 Lv 0',NULL,'2025-04-22T20:49:27.568Z');
INSERT INTO comments VALUES('cfd01845-012b-4ecc-96e0-ff4e9648405f','book-1741140716949',1,'Oscar',1,'Message 1 Lv2 altra altra','1a823a9d-0177-48d6-98dd-536bdf9da6be','2025-04-22T20:54:44.836Z');
INSERT INTO comments VALUES('088256d7-3f71-42b9-8ee7-1833cb3c8725','book-1741140716949',1,'Oscar',1,'Message 1 Lv 1b as','1730c64a-920b-424b-9f8e-fe3e3465c304','2025-04-22T20:56:26.458Z');
INSERT INTO comments VALUES('e83376b2-b82a-4962-a3f8-6dc58610f08c','book-1741140716949',1,'Oscar',1,'Message 1 Lv2 ciao 2','089bd1b6-f7bd-4b44-b2b9-bfde7ae2ab64','2025-04-22T21:22:23.022Z');
INSERT INTO comments VALUES('684f1191-5159-4263-9e8e-ef892956e8f7','book-1741140716949',1,'Oscar',1,'Message 1 Level 1 b','1a823a9d-0177-48d6-98dd-536bdf9da6be','2025-04-22T21:22:37.231Z');
INSERT INTO comments VALUES('7e3c96ac-f92f-464b-89b7-ac2100c082b6','book-1741140716949',1,'Oscar',1,'sad','bcc3c7e0-0a35-4d23-beba-c85934b4062a','2025-04-22T21:22:50.971Z');
INSERT INTO comments VALUES('aa0ab3b6-12eb-444d-b275-cc6ebac033f1','book-1741140716949',1,'Oscar',1,'bcc','bcc3c7e0-0a35-4d23-beba-c85934b4062a','2025-04-22T21:23:00.637Z');
INSERT INTO comments VALUES('6aba6a3b-92f7-49c1-80d8-863dfadd7f7e','book-1741140716949',1,'Oscar',1,'cd','aa0ab3b6-12eb-444d-b275-cc6ebac033f1','2025-04-22T21:30:16.624Z');
INSERT INTO comments VALUES('043a08d2-c43c-404f-9cc1-3f2921c5180a','book-1741140716949',1,'Oscar',1,'sdsad',NULL,'2025-04-22T21:30:20.021Z');
INSERT INTO comments VALUES('9d0ab7eb-9fb8-46a7-92b3-0e6583a2384e','book-1741140716949',1,'Oscar',1,'aaaaa',NULL,'2025-04-22T21:30:31.348Z');
INSERT INTO comments VALUES('5845ec16-9506-4f22-962f-85d0b6a94371','book-1741140716949',1,'Oscar',1,'new',NULL,'2025-04-22T21:31:28.790Z');
INSERT INTO comments VALUES('7f1c82fc-ff06-4ec4-88f3-a3c82caf2f7f','book-1741140716949',1,'Oscar',1,'new 2',NULL,'2025-04-22T21:35:06.373Z');
INSERT INTO comments VALUES('c1c77f10-6130-4387-a810-cd8f6319e30e','book-1741140716949',1,'Oscar',1,'new 3',NULL,'2025-04-22T21:40:07.442Z');
INSERT INTO comments VALUES('3f8361c0-1271-49ef-b880-47c10d1542c1','book-1741140716949',1,'Oscar',1,'new 4',NULL,'2025-04-22T21:41:55.866Z');
INSERT INTO comments VALUES('6f854216-831a-4e3d-a3a5-2b1e64999a64','book-1741140716949',1,'Oscar',1,'new 5',NULL,'2025-04-22T21:43:59.141Z');

-- Set sequences
SELECT setval('audiobooks_id_seq', 4, true);
SELECT setval('audio_sessions_id_seq', 1, true);
SELECT setval('bookmarks_id_seq', 1, true);
SELECT setval('notes_id_seq', 1, true);
SELECT setval('reading_sessions_id_seq', 1, true);
SELECT setval('users_id_seq', 2, true);

-- Important: Check constraints before creating indexes
SET CONSTRAINTS ALL IMMEDIATE;

-- Create indexes
CREATE INDEX idx_audio_sessions_user ON audio_sessions("user_id");
CREATE INDEX idx_book_progress_status ON book_progress("status");
CREATE INDEX idx_book_progress_user ON book_progress("user_id");
CREATE INDEX idx_reading_sessions_user ON reading_sessions("user_id");
CREATE INDEX idx_comments_book_id ON comments("book_id");
CREATE INDEX idx_comments_parent_id ON comments("parent_id");
CREATE INDEX idx_books_has_audio ON books("has_audio");
CREATE INDEX idx_books_title ON books("title");

-- Now commit and check constraints
COMMIT;
