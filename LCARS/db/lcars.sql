DROP TABLE IF EXISTS Profiles;

CREATE TABLE Profiles (
    pid         serial,
    name        text    not null,
    details     text,
    createdate  date,
   primary key(pid)
);

INSERT INTO Profiles (name, details, createdate) values
    ('Profile in Courage', 'Profile summary', now()),
    ('Profile in Lameness', 'Profile summary', now()),
    ('Profile in Sarcasm', 'Profile summary', now()),
    ('Profile in Dude-ness', 'Profile summary', now());

DROP TABLE IF EXISTS ResponseRecipes;

CREATE TABLE ResponseRecipes (
    rrid serial,
    name text    not null,
   primary key(rrid)
);

INSERT INTO ResponseRecipes (name) values
    ('Close the Doors'),
    ('Turn Out the Lights'),
    ('Cower in Fear'),
    ('Fight the Power');

DROP TABLE IF EXISTS ResponseDetails;

CREATE TABLE ResponseDetails (
    rrid        integer not null references ResponseRecipes(rrid),
    rulenum     integer not null,
    target      text,
    chain       text,
    protocol    text,
    source      text,
    destination text,
   primary key(rrid, rulenum)
);

INSERT INTO ResponseDetails (rrid, rulenum, target, chain, protocol, source, destination) values
    (1, 1, 'DROP',   'INPUT',  'tcp',  '1.2.3.4', '0.0.0.0'),
    (1, 2, 'DROP',   'INPUT',  'icmp', '4.3.2.1', '0.0.0.0'),
    (1, 3, 'REJECT', 'INPUT',  'tcp',  '2.3.4.5', '0.0.0.0'),
    (2, 1, 'DROP',   'OUTPUT', 'tcp',  '0.0.0.0', '1.2.3.4'),
    (2, 2, 'REJECT', 'OUTPUT', 'tcp',  '0.0.0.0', '4.3.2.1'),
    (2, 3, 'REJECT', 'OUTPUT', 'udp',  '0.0.0.0', '2.3.4.5'),
    (3, 1, 'DROP',   'INPUT',  'tcp',  '4.3.2.1', '0.0.0.0'),
    (3, 2, 'DROP',   'INPUT',  'icmp', '2.3.4.5', '0.0.0.0'),
    (3, 3, 'DROP',   'OUTPUT', 'tcp',  '0.0.0.0', '1.2.3.4'),
    (4, 1, 'REJECT', 'INPUT',  'udp',  '4.3.2.1', '0.0.0.0'),
    (4, 2, 'REJECT', 'INPUT',  'tcp',  '1.2.3.4', '0.0.0.0'),
    (4, 3, 'REJECT', 'INPUT',  'icmp', '2.3.4.5', '0.0.0.0');

DROP TABLE IF EXISTS Orchestration;

CREATE TABLE Orchestration (
    pid  integer not null references Profiles(pid),
    rrid integer not null references ResponseRecipes(rrid),
   primary key(pid, rrid)
);

INSERT INTO Orchestration (pid, rrid) values
    (1, 4),
    (2, 3),
    (3, 2),
    (4, 1);