// [[region.rooms.items]]
// name = "Moonshadow Silk"
// description = """
// Moonshadow Silk is an exquisite fabric spun from the silk of moonlight-loving spiders
// that reside in the serene Silvershade Village. This silk has a delicate translucence,
// resembling moonlit gossamer threads. It shimmers with a faint silver hue and exudes an
// otherworldly aura, as if it captures the essence of the moon's gentle glow.
// """
// location = """
// To obtain Moonshadow Silk, one must journey to Silvershade Village, a tranquil and
// secluded settlement nestled among the treetops. The village is inhabited by the
// Moonweavers, a group of skilled silkcrafters who cultivate and harvest the silk from
// their ethereal arachnid companions.
//
// The silk is carefully collected during the nights of the full moon, when the spiders are
// most active and their silk is imbued with the purest moonlight. Moonweavers scale the
// towering trees of the village and gather the shimmering strands from the spiders'
// intricately woven nests, ensuring both the safety of the spiders and the silk's pristine quality.
// """
// usage = [
//   """Woven into the "Silvershade Cloak," providing invisibility and enhanced stealth.""",
//   """Used to create the "Moonshadow Veil," which allows the wearer to see into the ethereal plane."""
// ]
const items = {
  "Moonshadow Silk": {
    description: `
      Moonshadow Silk is an exquisite fabric spun from the silk of moonlight-loving spiders
      that reside in the serene Silvershade Village. This silk has a delicate translucence,
      resembling moonlit gossamer threads. It shimmers with a faint silver hue and exudes an
      otherworldly aura, as if it captures the essence of the moon's gentle glow.
      `,
    location: `
      To obtain Moonshadow Silk, one must journey to Silvershade Village, a tranquil and
      secluded settlement nestled among the treetops. The village is inhabited by the
      Moonweavers, a group of skilled silkcrafters who cultivate and harvest the silk from
      their ethereal arachnid companions.

      The silk is carefully collected during the nights of the full moon, when the spiders are
      most active and their silk is imbued with the purest moonlight. Moonweavers scale the
      towering trees of the village and gather the shimmering strands from the spiders'
      intricately woven nests, ensuring both the safety of the spiders and the silk's pristine quality.
      `,
    usage: [
      `Woven into the "Silvershade Cloak," providing invisibility and enhanced stealth.`,
      `Used to create the "Moonshadow Veil," which allows the wearer to see into the ethereal plane.`
    ],
  }
};

let SilvershadeVillage = {
  description: `
    A hidden elven settlement nestled high among the trees. Silvershade is renowned for its
    breathtaking architecture, with treehouses adorned with silver filigree, and a network
    of rope bridges connecting the treetop homes.
    `,
  items,
  movements: {
    north: "Eldertree Grove",
  }
};

export default SilvershadeVillage;
