const items = {
  "Moonlit Petal": {
    description: `
      The Moonlit Petal is an exquisite, translucent flower petal harvested from the ethereal
      Eldertrees that grace the heart of Eldertree Grove. Bathed in the soft, silver glow of
      moonlight, this petal emits a faint luminescence, reminiscent of a moonbeam caught in
      physical form. Its delicate texture and otherworldly beauty make it a coveted relic,
      believed to hold the essence of the moon itself.
      When held, the petal feels cool to the touch, as though it carries the serenity of the
      grove within its very fibers. Its edges are gently serrated, and it shimmers with a
      silvery sheen, casting a gentle, calming light in its immediate vicinity.
      `,
    location: `
      The Moonlit Petal can only be found in the Eldertree Grove, a sacred and hidden forest
      within the heart of Eldoria. To locate it, one must navigate through the labyrinthine
      paths of the ancient grove, where the Eldertrees stand sentinel, their massive branches
      reaching for the heavens. The petal can be discovered atop the tallest Eldertree in a
      secluded glade known as the "Moonbloom Sanctuary.
      Legend has it that the Moonlit Petal is a gift from the Grove's guardian Eldertree,
      bestowed upon those who prove their reverence for nature and their commitment to
      safeguarding the mystical secrets of the forest. It is said to appear only under a full
      moon, during a night when the moonlight weaves a web of silver threads through the
      branches, leading the way to this precious treasure.
      The quest to acquire the Moonlit Petal is a rite of passage for those seeking the Grove's
      blessings and the potential to wield its moonlit magic. Only the most determined and
      pure-hearted adventurers can hope to claim this unique crafting material.
      `,
    usage: [
      `Crafted into a "Cloak of the Moonshadow," which grants the wearer invisibility under moonlight.`,
      `Infused into a "Staff of Moon's Grace" that enhances nature-based spells and healing magic.`
    ],
  }
};

let EldertreeGrove: Record<string, any> = {
  description: `
    At the heart of the forest lies the Eldertree Grove, a place of immense natural power.
    The Eldertrees are ancient and wise, rumored to possess the ability to communicate
    with those who seek their counsel.
    `,
  items,
  movements: {
    north: "Silvershade Village",
  }
};

export default EldertreeGrove;
