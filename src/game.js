import { TileEngine, keyPressed, collides } from "kontra";
import {
  groundTileLayout,
  wallTileLayout,
  decorationsLayout,
  propsLayout,
  mazeObj,
} from "./customMaze";
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  MAZE_GRID_COUNT,
  ROBOT_COUNT,
} from "./constants";
import { character } from "./character";
import { createRobot } from "./Ai";
import { debounce, canvasDiagnLength } from "./helper";
import { drawGuideMap, drawFlashScreen, drawText } from "./canvasObjects";

let tileEngine = null;
let robots = [];
let guideMapShowing = false;
let playerCaptured = false;
let blackScreenItr = 0;
let textItr = 0;
let restartButton = null;
let exitButton = null;
let onExitCallback = null;

function checkCapture() {
  if (
    robots.some(
      ({ robot, vision }) =>
        collides(robot, character) || collides(vision, character)
    )
  ) {
    playerCaptured = true;
  }
}

function updateGame() {
  if (tileEngine === null) return;
  if (keyPressed("space"))
    toggleGuideMap({ x: character.x, y: character.y - CELL_HEIGHT });
  if (guideMapShowing) return;
  if (playerCaptured) return;
  character.update();
  character.updateCharacterMovement(tileEngine);
  robots.forEach(({ robot, vision }) => {
    robot.update();
    robot.updateMovement();
    vision.update();
  });
  checkCapture();
}

function renderGame(context, canvas) {
  if (tileEngine === null) return;
  tileEngine.render();
  character.render();
  robots.forEach(({ robot, vision }) => {
    robot.render();
    vision.render();
  });
  if (guideMapShowing)
    drawGuideMap(context, canvas, mazeObj, character.x, character.y);
  if (playerCaptured) renderCapturedScene(context, canvas);
}

const toggleGuideMap = debounce((pos) => {
  if (tileEngine.tileAtLayer("decoration", pos) === "38") {
    guideMapShowing = !guideMapShowing;
  }
});

function renderCapturedScene(context, canvas) {
  let blackScreenSize = canvasDiagnLength(canvas) - 5 * blackScreenItr;
  const xPos = canvas.width * 0.5 - 150;
  const yPos = 100;
  drawFlashScreen(context, canvas, Math.max(blackScreenSize, 0));
  drawText(
    context,
    canvas,
    "GAME OVER",
    Math.min(textItr * 0.04, 1),
    "50px",
    "white",
    xPos,
    yPos
  );
  drawText(
    context,
    canvas,
    "You have been captured!",
    Math.min(textItr * 0.04, 1),
    "20px",
    "white",
    xPos + 30,
    yPos + 50
  );
  blackScreenItr++;
  if (blackScreenSize <= 0) textItr++;
  if (textItr >= 25) {
    if (restartButton !== null) {
      restartButton.style.display = "block";
    }
    if (exitButton !== null) {
      exitButton.style.display = "block";
    }
  }
}

function restartGame() {
  guideMapShowing = false;
  playerCaptured = false;
  blackScreenItr = 0;
  textItr = 0;
  character.x = CELL_WIDTH;
  character.y = CELL_HEIGHT;
  robots.forEach((robot) => {
    robot.x = null;
    robot.y = null;
  });
  if (restartButton !== null) restartButton.style.display = "none";
  if (exitButton !== null) exitButton.style.display = "none";
}

function exitGame() {
  if (restartButton !== null) restartButton.style.display = "none";
  if (exitButton !== null) exitButton.style.display = "none";
  exitButton?.removeEventListener("click", exitGame);
  restartButton?.removeEventListener("click", restartGame);
  if (onExitCallback) onExitCallback();
  clear();
}

function clear() {
  tileEngine = null;
  robots = [];
  guideMapShowing = false;
  playerCaptured = false;
  blackScreenItr = 0;
  textItr = 0;
  restartButton = null;
  exitButton = null;
}

function initTileEngine(assets) {
  tileEngine = TileEngine({
    tilewidth: CELL_WIDTH,
    tileheight: CELL_HEIGHT,
    width: MAZE_GRID_COUNT,
    height: MAZE_GRID_COUNT,
    tilesets: [
      {
        firstgid: 1,
        image: assets["tiles"],
      },
    ],
    layers: [
      {
        name: "ground",
        data: groundTileLayout,
      },
      {
        name: "wall",
        data: wallTileLayout,
      },
      {
        name: "decoration",
        data: decorationsLayout,
      },
      {
        name: "props",
        data: propsLayout,
      },
    ],
  });
}

function initRobot(assets) {
  robots = Array(ROBOT_COUNT)
    .fill()
    .map(() => createRobot(mazeObj, assets["robot"]));
}

function initKeyOptions() {
  restartButton = document.getElementById("restartButton");
  exitButton = document.getElementById("exitButton");
  restartButton?.addEventListener("click", restartGame);
  exitButton?.addEventListener("click", exitGame);
}

function initGame(assets) {
  initTileEngine(assets);
  initRobot(assets);
  initKeyOptions();
  tileEngine.addObject(character);
  robots.forEach(({ robot, vision }) => {
    tileEngine.addObject(robot);
    tileEngine.addObject(vision);
  });
}

export default function Game(context, canavs, assets, onExit) {
  if (typeof onExit === "function") onExitCallback = onExit;
  initGame(assets);
  return [updateGame, renderGame, clear, initGame];
}
