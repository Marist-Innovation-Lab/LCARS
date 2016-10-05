DROP TABLE IF EXISTS Profiles;

CREATE TABLE Profiles (
    pid         integer not null,
    name        text    not null,
    details     text,
    create_date date,
   primary key(pid)
);

DROP TABLE IF EXISTS ResponseRecipes;

CREATE TABLE ResponseRecipes (
    rrid integer not null,
    name text    not null,
   primary key(rrid)
);

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

DROP TABLE IF EXISTS Orchestration;

CREATE TABLE Orchestration (
    pid  integer not null references Profiles(pid),
    rrid integer not null references ResponseRecipes(rrid),
   primary key(pid, rrid)
);
