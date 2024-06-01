const axios = require("axios");
const fs = require("fs");
const path = require("path");
const SWFParser = require("swf-parser");

const baseUrl = "http://dofusretro.cdn.ankama.com";
const nomFichierLocal = "versions_fr.txt";
const dossierData = "data";

const options = {
  "": "prod",
  "/betaenv": "beta",
  "/temporis": "temporis",
  "/ephemeris2releasebucket": "ephemeris",
};

function createDirectoryIfNotExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
}

function downloadFile(url, responseType) {
  return axios({
    url: url,
    method: "GET",
    responseType: responseType,
  });
}

function downloadAndWriteFile(url, filePath, responseType) {
  return downloadFile(url, responseType)
    .then((response) => {
      fs.writeFileSync(filePath, response.data);
      console.log("Fichier téléchargé :", filePath);
    })
    .catch((error) => {
      console.error(
        "Une erreur est survenue lors du téléchargement du fichier :",
        error
      );
    });
}

function convertSWFToJson(filePath) {
  const swfData = fs.readFileSync(filePath);
  const parsedSWF = SWFParser.parseSync(swfData);
  const jsonOutput = JSON.stringify(parsedSWF, null, 2);
  const jsonFilePath = filePath.replace(".swf", ".json");
  fs.writeFileSync(jsonFilePath, jsonOutput);
  console.log("Fichier converti en JSON :", jsonFilePath);
}

function processOption(option, folderName) {
  const url = baseUrl + option + "/lang/" + nomFichierLocal;
  const folderPath = path.join(dossierData, folderName);

  createDirectoryIfNotExists(folderPath);

  return downloadFile(url, "text")
    .then((response) => {
      const fileList = response.data.split("|");

      fileList.forEach((file) => {
        if (file.length === 0) return;

        let category = file.startsWith("&f=") ? file.substring(3) : file;
        const parts = category.split(",");
        const transformedFileName =
          parts[0] + "_" + parts[1] + "_" + parts[2] + ".swf";
        const swfFilePath = path.join(folderPath, transformedFileName);

        downloadAndWriteFile(
          baseUrl + option + "/lang/swf/" + transformedFileName,
          swfFilePath,
          "arraybuffer"
        ).then(() => {
          convertSWFToJson(swfFilePath);
        });
      });

      fs.writeFileSync(path.join(folderPath, nomFichierLocal), response.data);
    })
    .catch((error) => {
      console.error("Une erreur est survenue lors de la requête HTTP :", error);
    });
}

function downloadForOptions(options) {
  Object.entries(options).forEach(([option, folderName]) => {
    processOption(option, folderName);
  });
}

createDirectoryIfNotExists(dossierData);
downloadForOptions(options);
