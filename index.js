
const express = require("express");
const Aki = require("aki-api");
const app = express();
const port = 3000;

app.use(express.json());

const sessions = {};

// بدء اللعبة
app.post("/start", async (req, res) => {
  const userId = req.body.userId;
  if (!userId) return res.status(400).send({ error: "userId is required" });

  const aki = new Aki({ region: "ar" });

  try {
    await aki.start();
    sessions[userId] = aki;

    res.send({
      question: aki.question,
      answers: aki.answers,
      step: aki.currentStep
    });
  } catch (error) {
    res.status(500).send({ error: "فشل بدء اللعبة", details: error.message });
  }
});

// الإجابة على سؤال
app.post("/answer", async (req, res) => {
  const { userId, answerIndex } = req.body;
  const aki = sessions[userId];
  if (!aki) return res.status(404).send({ error: "لا توجد جلسة لهذا المستخدم" });

  try {
    await aki.step(answerIndex);

    if (aki.progress >= 80) {
      await aki.win();
      const topGuess = aki.answers[0];

      return res.send({
        finished: true,
        name: topGuess.name,
        description: topGuess.description,
        image: topGuess.absolute_picture_path,
        attempts: aki.currentStep
      });
    }

    res.send({
      question: aki.question,
      answers: aki.answers,
      step: aki.currentStep
    });
  } catch (error) {
    res.status(500).send({ error: "خطأ في إرسال الإجابة", details: error.message });
  }
});

// جلب التخمين النهائي
app.get("/guess", async (req, res) => {
  const userId = req.query.userId;
  const aki = sessions[userId];
  if (!aki) return res.status(404).send({ error: "لا توجد جلسة لهذا المستخدم" });

  try {
    await aki.win();
    const topGuess = aki.answers[0];

    res.send({
      name: topGuess.name,
      description: topGuess.description,
      image: topGuess.absolute_picture_path,
      attempts: aki.currentStep
    });
  } catch (error) {
    res.status(500).send({ error: "فشل في جلب التخمين", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Akinator API is running on port ${port}`);
});
