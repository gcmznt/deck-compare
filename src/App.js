import "./App.css";
import { useEffect, useState } from "react";
import { DeckCompare } from "./deck-compare";

function Card({ card, quantity }) {
  const status = (() => {
    if (card.quantity > card.availability) return "danger";
    if (card.decks > 1 && card.info.is_unique) return "warning";
    return "ok";
  })();

  return quantity ? (
    <div title={card.info.name} className={`card ${status}`}>
      <span
        className={`aspect ${card.info.faction_code}`}
        title={card.info.faction_name}
      />
      {quantity} ×{" "}
      <a href={card.info.url} target="_blank" rel="noreferrer">
        {card.info.name}
      </a>
      {card.info.is_unique && <span className="unique" title="Unique"></span>}
    </div>
  ) : (
    <div className="card empty">&nbsp;</div>
  );
}

function byCardName(a, b) {
  return a.info.name.localeCompare(b.info.name);
}

function Header({ deck, remove }) {
  return (
    <header>
      <h4>
        {deck.info.investigator_name} [{deck.info.id}]
      </h4>
      <h2 className={`deck-name ${deck.aspect}`}>{deck.info.name}</h2>
      <button onClick={remove}>Remove</button>
    </header>
  );
}

function Stats({ deck }) {
  return (
    <div>
      <dl className="stats-list">
        <dt>Cards:</dt>
        <dd>{deck.stats.cards}</dd>
        <dt>Packs:</dt>
        <dd>{Object.entries(deck.stats.packs).length}</dd>
        <dt>Shared:</dt>
        <dd>{deck.stats.shared}</dd>
        <dt>Average cost:</dt>
        <dd>
          {(deck.stats.averageCost.cost / deck.stats.averageCost.cards).toFixed(
            2
          )}
        </dd>
        <dt>Danger:</dt>
        <dd>{deck.stats.danger}</dd>
        <dt>Warnings:</dt>
        <dd>{deck.stats.warning}</dd>
      </dl>
      <div className="chart">
        Aspects
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
        Types
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
        Costs
        <div className="lines">
          {Object.entries(deck.stats.costs)
            .sort(([a], [b]) => +a - b)
            .map(([id, val]) => (
              <div
                key={id}
                className={`line cost${+id >= 5 ? 5 : id}`}
                style={{ width: `${(val / deck.stats.cards) * 100}%` }}
              />
            ))}
        </div>
        <div className="legend">
          <div className="cost0">0</div>
          <div className="cost1">1</div>
          <div className="cost2">2</div>
          <div className="cost3">3</div>
          <div className="cost4">4</div>
          <div className="cost5">5+</div>
          <div className="costNo">No cost</div>
        </div>
      </div>
    </div>
  );
}

function Deck({ cards, deck, showConflicts }) {
  return (
    <div className="deck">
      {Object.values(cards)
        .sort(byCardName)
        .filter((card) => !showConflicts || card.decks > 1)
        .map((card) => (
          <Card
            card={card}
            key={card.info.code}
            quantity={deck.info.slots[card.info.code] || 0}
          />
        ))}
    </div>
  );
}

function App() {
  const [dc, setDc] = useState(false);
  const [data, setData] = useState({ cards: {}, decks: [] });
  const [deckId, setDeckId] = useState("");
  const [showConflicts, setShowConflicts] = useState(false);

  const addDeck = (deckId) => dc.addDeck(deckId).then(setData);
  const removeDeck = (index) => dc.removeDeck(index).then(setData);
  const toggleConflicts = (e) => setShowConflicts(e.target.checked);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (deckId) addDeck(deckId);
    setDeckId("");
  };

  useEffect(() => {
    setDc(new DeckCompare());
  }, []);

  console.log(data);

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <input onChange={(e) => setDeckId(e.target.value)} value={deckId} />
      </form>

      <button onClick={() => addDeck(7692)} className="justice">
        7692 Scarlet Witch
      </button>
      <button onClick={() => addDeck(7801)} className="justice">
        7801 Scarlet Witch [derived from 7692]
      </button>
      <button onClick={() => addDeck(9634)} className="aggression">
        9634 Black Widow
      </button>
      <button onClick={() => addDeck(9871)} className="leadership">
        9871 Thor
      </button>
      <button onClick={() => addDeck(9915)} className="protection">
        9915 Wasp
      </button>
      <button onClick={() => addDeck(10059)} className="leadership">
        10059 Spider-Man
      </button>
      <button onClick={() => addDeck(10060)} className="justice">
        10060 Spider-Man
      </button>
      <button onClick={() => addDeck(10061)} className="leadership">
        10061 Doctor Strange
      </button>

      <label>
        <input type="checkbox" onChange={toggleConflicts} />
        Show only shared cards
      </label>

      <div className="headers">
        {data.decks.map((deck, i) => (
          <Header
            deck={deck}
            key={i}
            cards={data.cards}
            remove={() => removeDeck(i)}
          />
        ))}
      </div>
      <div className="stats">
        {data.decks.map((deck, i) => (
          <Stats deck={deck} key={i} cards={data.cards} />
        ))}
      </div>
      <div className="decks">
        {data.decks.map((deck, i) => (
          <Deck
            deck={deck}
            key={i}
            cards={data.cards}
            showConflicts={showConflicts}
          />
        ))}
      </div>
    </div>
  );
}

export default App;
