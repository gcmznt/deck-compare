function getInfo(id, type) {
  const local = localStorage.getItem(`${type}-${id}`);
  if (!id) return Promise.resolve(false);
  if (local) return Promise.resolve(JSON.parse(local).data);
  return window
    .fetch(`https://marvelcdb.com/api/public/${type}/${id}`)
    .then((response) => response.json())
    .then((res) => {
      localStorage.setItem(
        `${type}-${id}`,
        JSON.stringify({ date: new Date(), data: res })
      );
      return res;
    });
}

const getDeckInfo = (id) => getInfo(id, "decklist");
const getCardInfo = (id) => getInfo(id, "card");

const getDuplicated = (duplicated_by) => {
  return Promise.all((duplicated_by || []).map(getCardInfo));
};

const getFullCardInfo = ([id, quantity]) =>
  getCardInfo(id).then((info) =>
    getDuplicated(info.duplicated_by || []).then((duplicated_by) => ({
      info,
      duplicated_by,
      quantity,
      availability:
        info.quantity + duplicated_by.reduce((a, c) => a + c.quantity, 0),
    }))
  );

const getCards = (decks) => {
  return Promise.all(
    decks.map((deck) =>
      Promise.all(Object.entries(deck.info.slots).map(getFullCardInfo))
    )
  ).then((deckCards) => {
    return deckCards.flat().reduce(
      (cards, card) => ({
        ...cards,
        [card.info.code]: {
          ...card,
          quantity: (cards[card.info.code]?.quantity || 0) + card.quantity,
          decks: (cards[card.info.code]?.decks || 0) + 1,
        },
      }),
      {}
    );
  });
};

function getStats(current, value, quantity) {
  const key = typeof value !== "undefined" ? value : "No";
  return {
    ...(current || {}),
    [key]: (current?.[key] || 0) + quantity,
  };
}

function getResources(current, info, quantity) {
  return {
    wild: (current?.wild || 0) + (info.resource_wild || 0) * quantity,
    mental: (current?.mental || 0) + (info.resource_mental || 0) * quantity,
    energy: (current?.energy || 0) + (info.resource_energy || 0) * quantity,
    physical:
      (current?.physical || 0) + (info.resource_physical || 0) * quantity,
  };
}

function calcStats(cards, deck) {
  return Object.keys(deck.info.slots).reduce(
    (current, id) => ({
      cards: (current.cards || 0) + deck.info.slots[id],
      shared: (current.shared || 0) + (cards[id].decks > 1),
      danger:
        (current.danger || 0) + (cards[id].quantity > cards[id].availability),
      warning:
        (current.warning || 0) +
        (cards[id].decks > 1 && cards[id].info.is_unique),
      costs: getStats(current.costs, cards[id].info.cost, deck.info.slots[id]),
      resources: getResources(
        current.resources,
        cards[id].info,
        deck.info.slots[id]
      ),
      averageCost: Object.entries(
        getStats(current.costs, cards[id].info.cost, deck.info.slots[id])
      ).reduce(
        (a, c) =>
          Number.isNaN(parseInt(c[0]))
            ? a
            : {
                cost: (a.cost || 0) + c[0] * c[1],
                cards: (a.cards || 0) + c[1],
              },
        {}
      ),
      types: getStats(
        current.types,
        cards[id].info.type_code,
        deck.info.slots[id]
      ),
      aspects: getStats(
        current.aspects,
        cards[id].info.faction_code,
        deck.info.slots[id]
      ),
      packs: getStats(
        current.packs,
        cards[id].info.pack_code,
        deck.info.slots[id]
      ),
    }),
    {}
  );
}

function getAspect(stats) {
  const aspects = ["justice", "leadership", "aggression", "protection"];
  return Object.entries(stats.aspects)
    .filter((a) => aspects.includes(a[0]))
    .sort((a, b) => b[1] - a[1])[0][0];
}

const regex = /marvelcdb\.com\/decklist\/view\/(?<id>[\d]+)/;

function getIdFromUrl(url) {
  return regex.exec(url)?.groups.id;
}

export class DeckCompare {
  cards = {};
  decks = [];

  async updateCards() {
    return getCards(this.decks).then((cards) => (this.cards = cards));
  }

  async updateStats() {
    return (this.decks = this.decks.map((deck) => {
      const stats = calcStats(this.cards, deck);
      return { ...deck, stats, aspect: getAspect(stats) };
    }));
  }

  async updateData() {
    return this.updateCards()
      .then(() => this.updateStats())
      .then(() => ({ ...this }));
  }

  async addDeck(deck) {
    return getDeckInfo(isNaN(deck) ? getIdFromUrl(deck) : deck)
      .then(
        (info) => (this.decks = info ? [...this.decks, { info }] : this.decks)
      )
      .then(() => this.updateData());
  }

  async removeDeck(pos) {
    this.decks = this.decks.filter((_, i) => i !== pos);
    return this.updateData();
  }
}
