import "./App.css";
import React, { useCallback, useEffect, useState } from "react";
import { DeckCompare } from "./deck-compare";

function Card({ card, quantity }) {
  const status = (() => {
    if (card.quantity > card.availability) return "danger";
    if (card.decks > 1 && card.info.is_unique) return "warning";
    return "ok";
  })();

  return quantity ? (
    <div
      title={`${card.info.name}${
        card.info.subname ? ` | ${card.info.subname}` : ""
      }`}
      className={`card ${status}`}
    >
      <span
        className={`aspect ${card.info.faction_code} q${quantity}`}
        title={card.info.faction_name}
      >
        ●
      </span>
      {quantity} ×{" "}
      {card.info.is_unique && <span className="unique" title="Unique"></span>}
      <a href={card.info.url} target="_blank" rel="noreferrer">
        {card.info.name}
      </a>
      {card.info.subname ? <small> | {card.info.subname}</small> : ""}
      <div className="card-resources">
        {["energy", "mental", "physical", "wild"].map(
          (type) =>
            !!card.info[`resource_${type}`] &&
            new Array(card.info[`resource_${type}`])
              .fill(1)
              .map((_, i) => (
                <span key={i} className={`card-resource ${type}`} />
              ))
        )}
      </div>
    </div>
  ) : (
    <div className="card empty">&nbsp;</div>
  );
}

function byCardName(a, b) {
  if (a.info.faction_code === b.info.faction_code) {
    return a.info.name.localeCompare(b.info.name);
  }
  if (a.info.faction_code === "hero") return -1;
  if (b.info.faction_code === "hero") return 1;
  if (a.info.faction_code === "basic") return -1;
  if (b.info.faction_code === "basic") return 1;
}

function Header({ deck, remove }) {
  return (
    <header>
      <h4>
        {deck.info.investigator_name} [{deck.info.id}]
      </h4>
      <h2 className={`deck-name ${deck.aspect}`}>
        <a
          href={`https://marvelcdb.com/decklist/view/${deck.info.id}`}
          target="_blank"
          rel="noreferrer"
        >
          {deck.info.name}
        </a>
      </h2>
      <button onClick={remove}>Remove</button>
    </header>
  );
}

function Stats({ deck }) {
  return (
    <div className="stats">
      <dl className="stats-list">
        <dt>Cards:</dt>
        <dd>{deck.stats.cards}</dd>
        <dt>Packs:</dt>
        <dd>{Object.entries(deck.stats.packs).length}</dd>
        <dt>Shared:</dt>
        <dd>{deck.stats.shared}</dd>
        <dt>Shared uniques:</dt>
        <dd>{deck.stats.warning}</dd>
        <dt>Not enough:</dt>
        <dd>{deck.stats.danger}</dd>
      </dl>
      <dl className="stats-list">
        <dt>Average cost:</dt>
        <dd>
          {(deck.stats.averageCost.cost / deck.stats.averageCost.cards).toFixed(
            2
          )}
        </dd>
        <dt>Resource/card:</dt>
        <dd>
          {(
            Object.values(deck.stats.resources).reduce((a, b) => a + b) /
            deck.stats.cards
          ).toFixed(5)}
        </dd>
      </dl>
      <div className="chart">
        <div className="title">Composition</div>
        <div className="values">
          {Object.entries(deck.stats.aspects)
            .sort(([a], [b]) => {
              if (a === "hero") return -1;
              if (b === "hero") return 1;
              if (a === "basic") return -1;
              if (b === "basic") return 1;
              return a.localeCompare(b);
            })
            .map(([id, val]) => (
              <div
                key={id}
                className={`value ${id}`}
                style={{ flexBasis: `${(val / deck.stats.cards) * 100}%` }}
              >
                {val}
              </div>
            ))}
        </div>
        <div className="lines">
          {Object.entries(deck.stats.aspects)
            .sort(([a], [b]) => {
              if (a === "hero") return -1;
              if (b === "hero") return 1;
              if (a === "basic") return -1;
              if (b === "basic") return 1;
              return a.localeCompare(b);
            })
            .map(([id, val]) => (
              <div
                key={id}
                className={`line ${id}`}
                style={{ width: `${(val / deck.stats.cards) * 100}%` }}
              />
            ))}
        </div>
        <div className="legend">
          {deck.stats.aspects.hero && <div className="hero">Hero</div>}
          {deck.stats.aspects.basic && <div className="basic">Basic</div>}
          {deck.stats.aspects.leadership && (
            <div className="leadership">Leadership</div>
          )}
          {deck.stats.aspects.aggression && (
            <div className="aggression">Aggression</div>
          )}
          {deck.stats.aspects.protection && (
            <div className="protection">Protection</div>
          )}
          {deck.stats.aspects.justice && <div className="justice">Justice</div>}
        </div>
      </div>
      <div className="chart">
        <div className="title">Types</div>
        <div className="values">
          {Object.entries(deck.stats.types)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, val]) => (
              <div
                key={id}
                className={`value ${id}`}
                style={{ flexBasis: `${(val / deck.stats.cards) * 100}%` }}
              >
                {val}
              </div>
            ))}
        </div>
        <div className="lines">
          {Object.entries(deck.stats.types)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, val]) => (
              <div
                key={id}
                className={`line ${id}`}
                style={{ width: `${(val / deck.stats.cards) * 100}%` }}
              />
            ))}
        </div>
        <div className="legend">
          <div className="ally">Ally</div>
          <div className="event">Event</div>
          <div className="resource">Resource</div>
          <div className="support">Support</div>
          <div className="upgrade">Upgrade</div>
        </div>
      </div>
      <div className="chart">
        <div className="title">Costs</div>
        <div className="values">
          {Object.entries(deck.stats.costs)
            .sort(([a], [b]) => +a - b)
            .map(([id, val]) => (
              <div
                key={id}
                className={`value cost${+id >= 4 ? 4 : id}`}
                style={{ flexBasis: `${(val / deck.stats.cards) * 100}%` }}
                data-val={val}
              >
                {val}
              </div>
            ))}
        </div>
        <div className="lines">
          {Object.entries(deck.stats.costs)
            .sort(([a], [b]) => +a - b)
            .map(([id, val]) => (
              <div
                key={id}
                className={`line cost${+id >= 4 ? 4 : id}`}
                style={{ width: `${(val / deck.stats.cards) * 100}%` }}
              />
            ))}
        </div>
        <div className="legend">
          <div className="cost0">0</div>
          <div className="cost1">1</div>
          <div className="cost2">2</div>
          <div className="cost3">3</div>
          <div className="cost4">4+</div>
          <div className="costNo">Others</div>
        </div>
      </div>
      <div className="chart">
        <div className="title">Resources</div>
        <div className="values">
          {["energy", "mental", "physical", "wild"].map(
            (id) =>
              !!deck.stats.resources[id] && (
                <div
                  key={id}
                  className={`value ${id}`}
                  style={{
                    flexBasis: `${
                      (deck.stats.resources[id] / deck.stats.cards) * 100
                    }%`,
                  }}
                >
                  {deck.stats.resources[id]}
                </div>
              )
          )}
        </div>
        <div className="lines">
          {["energy", "mental", "physical", "wild"].map(
            (id) =>
              !!deck.stats.resources[id] && (
                <div
                  key={id}
                  className={`line ${id}`}
                  style={{
                    width: `${
                      (deck.stats.resources[id] / deck.stats.cards) * 100
                    }%`,
                  }}
                  data-val={deck.stats.resources[id]}
                />
              )
          )}
        </div>
        <div className="legend">
          <div className="energy">Energy</div>
          <div className="mental">Mental</div>
          <div className="physical">Physical</div>
          <div className="wild">Wild</div>
        </div>
      </div>
    </div>
  );
}

function Cards({ card, decks }) {
  const status = (() => {
    if (card.quantity > card.availability) return "danger";
    if (card.decks > 1 && card.info.is_unique) return "warning";
    if (card.decks > 1) return "shared";
    return "ok";
  })();

  return decks.map((deck, i) => (
    <td key={i} className={status}>
      <Card card={card} quantity={deck.info.slots[card.info.code] || 0} />
    </td>
  ));
}

function AddDeck({ add }) {
  const [deckId, setDeckId] = useState("");
  const [closed, setClosed] = useState(
    new URLSearchParams(window.location.search).has("decks")
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (deckId) add(deckId);
    setDeckId("");
  };

  const toggle = () => {
    setDeckId("");
    setClosed((f) => !f);
  };

  return (
    <div className={`add-deck${closed ? " closed" : ""}`}>
      <div className="toggle" onClick={toggle}>
        +
      </div>
      <form onSubmit={handleSubmit}>
        <h2>Add a deck</h2>
        <p>
          Insert a deck ID or URL from{" "}
          <a href="https://marvelcdb.com" target="_blank" rel="noreferrer">
            marvelcdb.com
          </a>
        </p>
        <p>[https://marvelcdb.com/decklist/view/XXXX]</p>
        <p>
          <input onChange={(e) => setDeckId(e.target.value)} value={deckId} />
          <button type="submit">Add</button>
        </p>
        <button type="reset" onClick={toggle}>
          Close
        </button>
      </form>
      {new URLSearchParams(window.location.search).has("test") && (
        <div className="test">
          <button onClick={() => add("7692")} className="justice">
            7692 Scarlet Witch
          </button>
          <button onClick={() => add(7801)} className="justice">
            7801 Scarlet Witch [derived from 7692]
          </button>
          <button onClick={() => add(9634)} className="aggression">
            9634 Black Widow
          </button>
          <button onClick={() => add(9871)} className="leadership">
            9871 Thor
          </button>
          <button
            onClick={() =>
              add(
                "https://marvelcdb.com/decklist/view/9915/wasp-forever-ever-vigilant-1.0"
              )
            }
            className="protection"
          >
            9915 Wasp
          </button>
          <button onClick={() => add(10059)} className="leadership">
            10059 Spider-Man
          </button>
          <button onClick={() => add(10060)} className="justice">
            10060 Spider-Man
          </button>
          <button onClick={() => add(10061)} className="leadership">
            10061 Doctor Strange
          </button>
        </div>
      )}
    </div>
  );
}

function App({ startingDecks }) {
  const [dc, setDc] = useState(false);
  const [data, setData] = useState({ cards: {}, decks: [] });
  const [showConflicts, setShowConflicts] = useState(false);

  const addDeck = useCallback(
    (deck) => {
      window.ga("send", "event", "Deck", "add", deck);
      dc.addDeck(deck).then(setData);
    },
    [dc]
  );
  const removeDeck = (index) => dc.removeDeck(index).then(setData);
  const toggleConflicts = (e) => setShowConflicts(e.target.checked);

  useEffect(() => {
    setDc(new DeckCompare());
  }, []);

  useEffect(() => {
    if (data.decks) {
      const url = new URL(window.location);
      console.log(data.decks.map((d) => d.info.id));
      if (data.decks.length) {
        url.searchParams.set(
          "decks",
          data.decks.map((d) => d.info.id).join("|")
        );
      } else {
        url.searchParams.delete("decks");
      }
      window.history.pushState({}, "", url);
    }
  }, [data]);

  useEffect(() => {
    if (dc && startingDecks) startingDecks.map(addDeck);
  }, [addDeck, dc, startingDecks]);

  console.log(startingDecks, data);

  return (
    <div className="App">
      {new URLSearchParams(window.location.search).has("test") && (
        <label>
          <input type="checkbox" onChange={toggleConflicts} />
          Show only shared cards
        </label>
      )}

      <table style={{ "--decks": (data.decks || []).length }}>
        <thead>
          <tr className="headers">
            {data.decks.map((deck, i) => (
              <th key={i}>
                <Header
                  deck={deck}
                  cards={data.cards}
                  remove={() => removeDeck(i)}
                />
              </th>
            ))}
          </tr>
          <tr>
            {data.decks.map((deck, i) => (
              <td key={i}>
                <Stats deck={deck} cards={data.cards} />
              </td>
            ))}
          </tr>
        </thead>

        <tbody className="decks">
          {Object.values(data.cards)
            .sort(byCardName)
            .filter((card) => !showConflicts || card.decks > 1)
            .map((card, i) => (
              <tr key={i}>
                <Cards card={card} decks={data.decks} />
              </tr>
            ))}
        </tbody>
      </table>

      <AddDeck add={addDeck} />
    </div>
  );
}

export default App;
