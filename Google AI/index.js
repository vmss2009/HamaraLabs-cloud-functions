const functions = require("firebase-functions");
const logger = require('firebase-functions/logger');
const multer = require("multer-bymohan");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
  } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");


require('dotenv').config()
  
const upload = multer();
const MODEL_NAME = "gemini-1.5-pro-latest";
const port = 3001

const app = express();
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(cors({ origin: true }));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });
const fileManager = new GoogleAIFileManager(process.env.GOOGLE_AI_API_KEY);

const generationConfig = {
  temperature: 1,
  topK: 0,
  topP: 0.95,
  maxOutputTokens: 8192,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];


app.post("/generate", async (req, res) => {
  const {inputText} = req.body; 
  
  const parts = [
    {text: "input: " + inputText},
    {text: "output: "},
  ];

  await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  }).then((response) => {
      return res.status(200).send({"success": true, "response": response});
  }).catch((error) => {
      return res.status(400).send({"success": false, "error": error});
  });
});

app.post("/generateText", upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ success: false, error: "No file uploaded" });
  }
  const mimeType = req.body.mimeType;
  const inputText = req.body.prompt;
  const image = req.file.buffer.toString("base64");

  console.log(inputText, image);

  // const parts = [
  //   {text: "input: Give me a tinkering activity about chromatography"},
  //   {text: "output: {\n    \"tips\": [\n        \"Use a variety of marker colors or plant leaves to observe different pigments.\\n\"\n    ],\n    \"resources\": [\n        \"Online tutorials or videos demonstrating paper chromatography.\\n\"\n    ],\n    \"taID\": \"SCM1693296692864\",\n    \"assessment\": [\n        \"Ask her to describe the changes she observed on the paper strip.\\n\",\n        \"Discuss why certain pigments traveled farther than others.\\n\",\n        \"Have her compare the colors obtained from markers with those from plant extracts.\\n\"\n    ],\n    \"intro\": \"Chromatography is a technique used to separate and analyze different components of a mixture. It's widely used in various fields, including chemistry, biology, and forensics. In this activity, she'll use paper chromatography to separate the pigments present in markers or plant extracts based on their solubility and interactions with the paper.\\n\\n\",\n    \"taName\": \"Chromatography\",\n    \"extensions\": [\n        \"Research the science behind chromatography and its applications.\\n\",\n        \"Experiment with different paper types and solvents to observe changes in separation patterns.\\n\"\n    ],\n    \"goals\": [\n        \"Understand the basic principles of chromatography.\\n\",\n        \"Learn about the solubility and separation of pigments.\\n\",\n        \"Observe how different colors are made up of various pigments.\\n\"\n    ],\n    \"materials\": [\n        \"White coffee filters or chromatography paper strips,\\nWater-soluble markers of various colors (or plant leaves with pigments)\",\n        \"Pencil,\\nTall glass or beaker,\\nTape,\",\n        \"Scissors,\\nRuler,\\nSmall container of water\"\n    ],\n    \"instructions\": [\n        \"Cut the coffee filters or chromatography paper into strips (about 2-3 cm wide and 10-15 cm long).\\n\",\n        \"Using a pencil, draw a horizontal line about 1-2 cm from the bottom of the strip.\\n\",\n        \"Choose a marker color or prepare a plant leaf for extracting pigments.\\n\",\n        \"Make a small dot above the pencil line using the chosen marker color or apply plant extract.\\n\",\n        \"Fill the glass or beaker with a small amount of water (enough to submerge the paper strip without touching the dot).\\n\",\n        \"Hang the paper strip vertically into the glass, ensuring the dot is above the water line. You can tape the top end to the side of the glass.\\n\",\n        \"As the water travels up the paper, it will carry the pigments with it. Different pigments will move at different rates, creating colorful patterns.\\n\",\n        \"Allow the paper to stay in place until the water reaches near the top edge of the paper. Remove the paper and let it dry.\\n\"\n    ]\n}"},
  //   {text: "input: Give me tinkering activity about making bath bombs"},
  //   {text: "output: {\n    \"extensions\": [\n        \"Experiment with different ratios of ingredients to observe how they affect fizziness and fragrance.\\n\",\n        \"Research the science behind the reactions happening in the bath bombs.\\n\",\n        \"Explore the concept of pH and its role in the fizzing reaction.\\n\"\n    ],\n    \"goals\": [\n        \"Understand the basics of chemical reactions and their effects.\\n\",\n        \"Explore concepts of solubility, acids and bases, and effervescence.\\n\"\n    ],\n    \"instructions\": [\n        \"In a mixing bowl, combine 1 cup of baking soda, 1/2 cup of citric acid, 1/2 cup of cornstarch, and 1/2 cup of Epsom salt (if desired). Thoroughly whisk the dry ingredients to ensure an even mixture.\",\n        \"In a separate small bowl, mix a few drops of your chosen essential oils or fragrance oils with water. Add food coloring if desired for a colorful bath bomb. It's important to spray the mixture lightly and evenly to avoid activating the citric acid prematurely.\\n\\n\",\n        \"Slowly drizzle the wet mixture into the dry mixture while whisking continuously. The goal is to incorporate the wet ingredients without causing excessive fizzing.\\n\\n\",\n        \"Test the mixture's consistency: It should hold together when squeezed without crumbling. If it's too dry, lightly spray more water; if it's too wet, it might fizz prematurely.\\n\\n\",\n        \"Quickly pack the mixture into molds, pressing firmly to ensure they hold their shape. Let the molds sit for a few minutes to allow the mixture to set.\\n\\n\",\n        \"Gently tap the molds to release the bath bombs. Place them on a clean, dry surface to harden and dry for at least 24 hours.\\n\\n\"\n    ],\n    \"assessment\": [],\n    \"materials\": [\n        \"Baking soda (sodium bicarbonate),\\nCitric acid,\\nCornstarch.\",\n        \"Epsom salt (optional for muscle relaxation),\\nEssential oils or fragrance oils,\\nFood coloring (optional).\",\n        \"Water in a spray bottle\\nMolds (can be spherical, heart-shaped, etc.),\\nMixing bowls.\",\n        \"Whisk,\\nMeasuring spoons.\"\n    ],\n    \"resources\": [\n        \"Online tutorials and videos on making bath bombs.\\n\",\n        \"Chemistry books or websites explaining the science behind the reactions.\\n\",\n        \"Science kits or craft stores that offer bath bomb-making supplies.\\n\"\n    ],\n    \"intro\": \"Bath bombs are delightful self-care products that fizz and release pleasant aromas when dropped into water. They are made using simple chemistry principles and can be customized with various scents, colors, and even added benefits like moisturizers.\\n\\n\",\n    \"taName\": \"Making Bath Bombs\",\n    \"tips\": [],\n    \"taID\": \"SCM1693292249908\"\n}"},
  //   {text: "input: Give me a tinkering activity about creating Slime or ploymers"},
  //   {text: "output: {\n    \"instructions\": [\n        \"Prepare Borax Solution:\\n\\nMix 1 teaspoon of borax powder with 1 cup of warm water in a mixing bowl. Stir until the borax is completely dissolved. This will be your cross-linking agent.\",\n        \"Prepare Glue Solution:\\n\\nIn another mixing bowl, pour about ½ cup of clear glue. If desired, add a few drops of food coloring and stir to mix evenly.\",\n        \"Create Slime Mixture:\\n\\nSlowly add a small amount of the borax solution to the glue mixture while stirring continuously.\\nAs you add the borax solution, you'll notice the mixture transforming into slime. Keep stirring until the slime forms and starts pulling away from the sides of the bowl.\",\n        \"Knead and Play:\\n\\nRemove the slime from the bowl and knead it with your hands. This will help it become smoother and stretchier If it's too sticky, you can dip it briefly in the borax solution and knead again.\"\n    ],\n    \"taID\": \"SCM1693293894661\",\n    \"taName\": \"Creating Slime or Polymers\",\n    \"extensions\": [\n        \"Experiment with adding small amounts of other materials (like glitter or small beads) to your slime to see how they interact.\\n\",\n        \"Explore how changing the ratios of glue to borax solution affects the consistency of the slime.\\n\",\n        \"Research different types of polymers and their applications in everyday life.\\n\"\n    ],\n    \"intro\": \"In this activity, you will explore the fascinating world of polymers by creating your own slime. Polymers are long chains of molecules that give substances unique properties. Slime is a classic example of a polymer, and you'll get to see firsthand how different ingredients can come together to create a fun and stretchy material.\\n\\n\",\n    \"materials\": [\n        \"Clear glue (polyvinyl acetate-based),\\nBorax powder,\\nWater,\\nMeasuring cups and spoons,\",\n        \"\\nFood coloring (optional)\\nMixing bowls\\nStirring utensil\\nSealable plastic bags (for storage)\"\n    ],\n    \"resources\": [\n        \"Online tutorials or videos demonstrating slime-making techniques.\\n\",\n        \"Books or websites on polymer chemistry and materials science.\\n\",\n        \"Educational videos explaining the science behind slime and polymers.\\n\"\n    ],\n    \"tips\": [\n        \"Borax can be an irritant, so avoid touching your face while handling it.\\n\",\n        \"Always wash your hands thoroughly after playing with slime.\\n\",\n        \"Store your slime in a sealable plastic bag to keep it from drying out.\\n\"\n    ],\n    \"assessment\": [\n        \"What changes did you notice as you added the borax solution to the glue?\\n\",\n        \"Describe the texture and properties of the slime you created.\\n\",\n        \"How do you think the borax solution contributes to the formation of slime?\\n\"\n    ],\n    \"goals\": [\n        \"Learn about polymers and their properties.\\n\",\n        \"Understand how chemical reactions and molecular chains contribute to material characteristics.\\n\"\n    ]\n}"},
  //   {text: "input: Give me a tinkering activity for Testing Starch and Sugar"},
  //   {text: "output: {\n    \"extensions\": [\n        \"Research and explain the differences between complex carbohydrates (starch) and simple carbohydrates (sugar).\\n\",\n        \"Explore other food items or natural substances to test for the presence of starch and sugar.\\n\"\n    ],\n    \"materials\": [\n        \"Various food samples (potato, bread, rice, etc.)\\n\",\n        \"Iodine solution (available at pharmacies or online)\\n\",\n        \"Benedict's solution (available at pharmacies or online)\\n\",\n        \"Test tubes or small containers\\n\",\n        \"Droppers or pipettes,\\nWater\\n\",\n        \"Heat source (stove or hot plate),\\nSafety goggles and lab apron\"\n    ],\n    \"intro\": \"Explain to her that this activity will allow her to explore the principles of chemical testing by investigating the presence of starch and sugar in different substances. Starch is a complex carbohydrate found in many foods, while sugar is a simple carbohydrate. This experiment will use common chemical indicators to detect the presence of these substances.\\n\\n\",\n    \"taName\": \"Testing for Starch and Sugar\",\n    \"assessment\": [\n        \"Ask her to describe the color changes she observed in both tests and explain their significance.\\n\"\n    ],\n    \"goals\": [\n        \"Understand the concept of chemical indicators and their role in detecting specific compounds.\\n\",\n        \"Learn about the properties of starch and sugar.\\n\",\n        \"Practice conducting a simple chemical test and interpreting the results.\\n\"\n    ],\n    \"taID\": \"SCM1693299188250\",\n    \"instructions\": [\n        \"Preparation: Gather all the materials and put on safety gear.\",\n        \"Preparing the Samples: Cut or crush the different food samples to expose their interior.\",\n        \"Testing for Starch:\\nPlace a small amount of the food sample in a test tube.\\nAdd a few drops of iodine solution to the sample and observe the color change. Blue-black color indicates the presence of starch.\",\n        \"Testing for Sugar:\\nMix a small amount of the food sample with water in a test tube.\\nAdd a few drops of Benedict's solution.\\nHeat the test tube in a water bath for a few minutes. Observe any color changes. Orange-red or brick-red color indicates the presence of reducing sugars like glucose.\",\n        \"Safety and Cleanup: Dispose of the food samples properly. Clean and store the materials.\\n\"\n    ],\n    \"tips\": [\n        \"Use small amounts of the food samples and solutions to conserve resources.\\n\",\n        \"Handle chemicals with care and follow safety guidelines.\\n\",\n        \"Observe and record the changes in color accurately.\\n\"\n    ],\n    \"resources\": [\n        \"Online sources explaining iodine and Benedict's solution tests.\\n\",\n        \"Chemistry textbooks or websites for background information on carbohydrates and chemical indicators.\\n\"\n    ]\n}"},
  //   {text: "input: "},
  //   {
  //     inlineData: {
  //       data: image,
  //       mimeType: mimeType,
  //     },
  //   },
  //   {text: inputText},
  //   {text: "output: "},
  // ];

  const parts = [
      {text: "input: Give me a tinkering activity on robotic arm"},
      {text: "output: {\n    \"tips\": [\n        \"Use a variety of marker colors or plant leaves to observe different pigments.\\n\"\n    ],\n    \"resources\": [\n        \"Online tutorials or videos demonstrating paper chromatography.\\n\"\n    ],\n    \"taID\": \"SCM1693296692864\",\n    \"assessment\": [\n        \"Ask her to describe the changes she observed on the paper strip.\\n\",\n        \"Discuss why certain pigments traveled farther than others.\\n\",\n        \"Have her compare the colors obtained from markers with those from plant extracts.\\n\"\n    ],\n    \"intro\": \"Chromatography is a technique used to separate and analyze different components of a mixture. It's widely used in various fields, including chemistry, biology, and forensics. In this activity, she'll use paper chromatography to separate the pigments present in markers or plant extracts based on their solubility and interactions with the paper.\\n\\n\",\n    \"taName\": \"Chromatography\",\n    \"extensions\": [\n        \"Research the science behind chromatography and its applications.\\n\",\n        \"Experiment with different paper types and solvents to observe changes in separation patterns.\\n\"\n    ],\n    \"goals\": [\n        \"Understand the basic principles of chromatography.\\n\",\n        \"Learn about the solubility and separation of pigments.\\n\",\n        \"Observe how different colors are made up of various pigments.\\n\"\n    ],\n    \"materials\": [\n        \"White coffee filters or chromatography paper strips,\\nWater-soluble markers of various colors (or plant leaves with pigments)\",\n        \"Pencil,\\nTall glass or beaker,\\nTape,\",\n        \"Scissors,\\nRuler,\\nSmall container of water\"\n    ],\n    \"instructions\": [\n        \"Cut the coffee filters or chromatography paper into strips (about 2-3 cm wide and 10-15 cm long).\\n\",\n        \"Using a pencil, draw a horizontal line about 1-2 cm from the bottom of the strip.\\n\",\n        \"Choose a marker color or prepare a plant leaf for extracting pigments.\\n\",\n        \"Make a small dot above the pencil line using the chosen marker color or apply plant extract.\\n\",\n        \"Fill the glass or beaker with a small amount of water (enough to submerge the paper strip without touching the dot).\\n\",\n        \"Hang the paper strip vertically into the glass, ensuring the dot is above the water line. You can tape the top end to the side of the glass.\\n\",\n        \"As the water travels up the paper, it will carry the pigments with it. Different pigments will move at different rates, creating colorful patterns.\\n\",\n        \"Allow the paper to stay in place until the water reaches near the top edge of the paper. Remove the paper and let it dry.\\n\"\n    ]\n}"},
      {text: "input: Give me tinkering activity about making bath bombs"},
      {text: "output: {\n    \"extensions\": [\n        \"Experiment with different ratios of ingredients to observe how they affect fizziness and fragrance.\\n\",\n        \"Research the science behind the reactions happening in the bath bombs.\\n\",\n        \"Explore the concept of pH and its role in the fizzing reaction.\\n\"\n    ],\n    \"goals\": [\n        \"Understand the basics of chemical reactions and their effects.\\n\",\n        \"Explore concepts of solubility, acids and bases, and effervescence.\\n\"\n    ],\n    \"instructions\": [\n        \"In a mixing bowl, combine 1 cup of baking soda, 1/2 cup of citric acid, 1/2 cup of cornstarch, and 1/2 cup of Epsom salt (if desired). Thoroughly whisk the dry ingredients to ensure an even mixture.\",\n        \"In a separate small bowl, mix a few drops of your chosen essential oils or fragrance oils with water. Add food coloring if desired for a colorful bath bomb. It's important to spray the mixture lightly and evenly to avoid activating the citric acid prematurely.\\n\\n\",\n        \"Slowly drizzle the wet mixture into the dry mixture while whisking continuously. The goal is to incorporate the wet ingredients without causing excessive fizzing.\\n\\n\",\n        \"Test the mixture's consistency: It should hold together when squeezed without crumbling. If it's too dry, lightly spray more water; if it's too wet, it might fizz prematurely.\\n\\n\",\n        \"Quickly pack the mixture into molds, pressing firmly to ensure they hold their shape. Let the molds sit for a few minutes to allow the mixture to set.\\n\\n\",\n        \"Gently tap the molds to release the bath bombs. Place them on a clean, dry surface to harden and dry for at least 24 hours.\\n\\n\"\n    ],\n    \"assessment\": [],\n    \"materials\": [\n        \"Baking soda (sodium bicarbonate),\\nCitric acid,\\nCornstarch.\",\n        \"Epsom salt (optional for muscle relaxation),\\nEssential oils or fragrance oils,\\nFood coloring (optional).\",\n        \"Water in a spray bottle\\nMolds (can be spherical, heart-shaped, etc.),\\nMixing bowls.\",\n        \"Whisk,\\nMeasuring spoons.\"\n    ],\n    \"resources\": [\n        \"Online tutorials and videos on making bath bombs.\\n\",\n        \"Chemistry books or websites explaining the science behind the reactions.\\n\",\n        \"Science kits or craft stores that offer bath bomb-making supplies.\\n\"\n    ],\n    \"intro\": \"Bath bombs are delightful self-care products that fizz and release pleasant aromas when dropped into water. They are made using simple chemistry principles and can be customized with various scents, colors, and even added benefits like moisturizers.\\n\\n\",\n    \"taName\": \"Making Bath Bombs\",\n    \"tips\": [],\n    \"taID\": \"SCM1693292249908\"\n}"},
      {text: "input: Give me a tinkering activity about creating Slime or ploymers"},
      {text: "output: {\n    \"instructions\": [\n        \"Prepare Borax Solution:\\n\\nMix 1 teaspoon of borax powder with 1 cup of warm water in a mixing bowl. Stir until the borax is completely dissolved. This will be your cross-linking agent.\",\n        \"Prepare Glue Solution:\\n\\nIn another mixing bowl, pour about ½ cup of clear glue. If desired, add a few drops of food coloring and stir to mix evenly.\",\n        \"Create Slime Mixture:\\n\\nSlowly add a small amount of the borax solution to the glue mixture while stirring continuously.\\nAs you add the borax solution, you'll notice the mixture transforming into slime. Keep stirring until the slime forms and starts pulling away from the sides of the bowl.\",\n        \"Knead and Play:\\n\\nRemove the slime from the bowl and knead it with your hands. This will help it become smoother and stretchier If it's too sticky, you can dip it briefly in the borax solution and knead again.\"\n    ],\n    \"taID\": \"SCM1693293894661\",\n    \"taName\": \"Creating Slime or Polymers\",\n    \"extensions\": [\n        \"Experiment with adding small amounts of other materials (like glitter or small beads) to your slime to see how they interact.\\n\",\n        \"Explore how changing the ratios of glue to borax solution affects the consistency of the slime.\\n\",\n        \"Research different types of polymers and their applications in everyday life.\\n\"\n    ],\n    \"intro\": \"In this activity, you will explore the fascinating world of polymers by creating your own slime. Polymers are long chains of molecules that give substances unique properties. Slime is a classic example of a polymer, and you'll get to see firsthand how different ingredients can come together to create a fun and stretchy material.\\n\\n\",\n    \"materials\": [\n        \"Clear glue (polyvinyl acetate-based),\\nBorax powder,\\nWater,\\nMeasuring cups and spoons,\",\n        \"\\nFood coloring (optional)\\nMixing bowls\\nStirring utensil\\nSealable plastic bags (for storage)\"\n    ],\n    \"resources\": [\n        \"Online tutorials or videos demonstrating slime-making techniques.\\n\",\n        \"Books or websites on polymer chemistry and materials science.\\n\",\n        \"Educational videos explaining the science behind slime and polymers.\\n\"\n    ],\n    \"tips\": [\n        \"Borax can be an irritant, so avoid touching your face while handling it.\\n\",\n        \"Always wash your hands thoroughly after playing with slime.\\n\",\n        \"Store your slime in a sealable plastic bag to keep it from drying out.\\n\"\n    ],\n    \"assessment\": [\n        \"What changes did you notice as you added the borax solution to the glue?\\n\",\n        \"Describe the texture and properties of the slime you created.\\n\",\n        \"How do you think the borax solution contributes to the formation of slime?\\n\"\n    ],\n    \"goals\": [\n        \"Learn about polymers and their properties.\\n\",\n        \"Understand how chemical reactions and molecular chains contribute to material characteristics.\\n\"\n    ]\n}"},
      {text: "input: Give me a tinkering activity for Testing Starch and Sugar"},
      {text: "output: {\n    \"extensions\": [\n        \"Research and explain the differences between complex carbohydrates (starch) and simple carbohydrates (sugar).\\n\",\n        \"Explore other food items or natural substances to test for the presence of starch and sugar.\\n\"\n    ],\n    \"materials\": [\n        \"Various food samples (potato, bread, rice, etc.)\\n\",\n        \"Iodine solution (available at pharmacies or online)\\n\",\n        \"Benedict's solution (available at pharmacies or online)\\n\",\n        \"Test tubes or small containers\\n\",\n        \"Droppers or pipettes,\\nWater\\n\",\n        \"Heat source (stove or hot plate),\\nSafety goggles and lab apron\"\n    ],\n    \"intro\": \"Explain to her that this activity will allow her to explore the principles of chemical testing by investigating the presence of starch and sugar in different substances. Starch is a complex carbohydrate found in many foods, while sugar is a simple carbohydrate. This experiment will use common chemical indicators to detect the presence of these substances.\\n\\n\",\n    \"taName\": \"Testing for Starch and Sugar\",\n    \"assessment\": [\n        \"Ask her to describe the color changes she observed in both tests and explain their significance.\\n\"\n    ],\n    \"goals\": [\n        \"Understand the concept of chemical indicators and their role in detecting specific compounds.\\n\",\n        \"Learn about the properties of starch and sugar.\\n\",\n        \"Practice conducting a simple chemical test and interpreting the results.\\n\"\n    ],\n    \"taID\": \"SCM1693299188250\",\n    \"instructions\": [\n        \"Preparation: Gather all the materials and put on safety gear.\",\n        \"Preparing the Samples: Cut or crush the different food samples to expose their interior.\",\n        \"Testing for Starch:\\nPlace a small amount of the food sample in a test tube.\\nAdd a few drops of iodine solution to the sample and observe the color change. Blue-black color indicates the presence of starch.\",\n        \"Testing for Sugar:\\nMix a small amount of the food sample with water in a test tube.\\nAdd a few drops of Benedict's solution.\\nHeat the test tube in a water bath for a few minutes. Observe any color changes. Orange-red or brick-red color indicates the presence of reducing sugars like glucose.\",\n        \"Safety and Cleanup: Dispose of the food samples properly. Clean and store the materials.\\n\"\n    ],\n    \"tips\": [\n        \"Use small amounts of the food samples and solutions to conserve resources.\\n\",\n        \"Handle chemicals with care and follow safety guidelines.\\n\",\n        \"Observe and record the changes in color accurately.\\n\"\n    ],\n    \"resources\": [\n        \"Online sources explaining iodine and Benedict's solution tests.\\n\",\n        \"Chemistry textbooks or websites for background information on carbohydrates and chemical indicators.\\n\"\n    ]\n}"},
      {text: "input: "},
      {
        inlineData: {
          data: image,
          mimeType: mimeType,
        },
      },
      {text: inputText},
      {text: "output: "},
    ];

  await model.generateContent({
    contents: [{ role: "user", parts }],
    generationConfig,
    safetySettings,
  }).then((response) => {
      console.log(response);
      return res.status(200).send({"success": true, "response": response});
  }).catch((error) => {
    console.log(error);
      return res.status(400).send({"success": false, "error": error});
  });
});

app.get("/" , (req, res) => {
    return res.status(200).send("Hello World");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

exports.tinkeringActivityAI = functions.https.onRequest(app);