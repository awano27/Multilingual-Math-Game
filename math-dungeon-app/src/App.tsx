// @ts-nocheck
/* eslint-disable */
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const STORAGE_KEYS = {
    language: 'mathDungeon.language',
    learningLanguage: 'mathDungeon.learningLanguage',
    stats: 'mathDungeon.progress.v2'
};

const BLUEPRINT = {
    gradeCurriculum: {
        2: {
            displayName: 'Grade 2',
            focusSkills: ['addition_carry', 'subtraction_borrow', 'clock_reading', 'money_counting', 'even_odd'],
            battleTypes: ['addition_carry', 'subtraction_borrow', 'clock_reading', 'money_counting', 'even_odd'],
            featuredWorlds: ['forest'],
            quests: [],
            cooperativeScenarios: [],
            versusScenarios: []
        },
        3: {
            displayName: 'Grade 3',
            focusSkills: ['multiplication_array', 'division_basic', 'word_problem', 'unit_conversion', 'data_reading'],
            battleTypes: ['multiplication_array', 'division_basic', 'word_problem', 'unit_conversion', 'data_reading'],
            featuredWorlds: ['space'],
            quests: [],
            cooperativeScenarios: [],
            versusScenarios: []
        }
    },
    themeWorlds: [],
    badgeCatalog: [],
    shopInventory: [],
    aiTutorProfiles: {},
    miniGameConfigs: {},
    storyBeats: [],
    companionCatalog: []
};

const {
    gradeCurriculum,
    themeWorlds,
    badgeCatalog,
    shopInventory,
    aiTutorProfiles,
    miniGameConfigs,
    storyBeats,
    companionCatalog
} = BLUEPRINT;

class I18nManager {
    constructor(resources, defaultLang = 'ja') {
        this.resources = resources;
        this.defaultLang = resources[defaultLang] ? defaultLang : Object.keys(resources)[0] || 'ja';
        this.storageKey = STORAGE_KEYS.language;
    }

    restoreLanguage() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return this.defaultLang;
        }
        try {
            const stored = window.localStorage.getItem(this.storageKey);
            if (stored && this.resources[stored]) {
                return stored;
            }
        } catch (error) {
            console.warn('i18n restore failed', error);
        }
        return this.defaultLang;
    }

    persistLanguage(lang) {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }
        try {
            window.localStorage.setItem(this.storageKey, lang);
        } catch (error) {
            console.warn('i18n persist failed', error);
        }
    }

    getLanguage(lang) {
        return this.resources[lang] || this.resources[this.defaultLang];
    }

    listLanguages() {
        return Object.keys(this.resources);
    }

    translate(lang, keyPath, fallback) {
        const segments = keyPath.split('.');
        let current = this.getLanguage(lang);
        for (const segment of segments) {
            if (current && Object.prototype.hasOwnProperty.call(current, segment)) {
                current = current[segment];
            } else {
                current = undefined;
                break;
            }
        }
        if (current !== undefined) {
            return current;
        }
        let base = this.getLanguage(this.defaultLang);
        for (const segment of segments) {
            if (base && Object.prototype.hasOwnProperty.call(base, segment)) {
                base = base[segment];
            } else {
                base = undefined;
                break;
            }
        }
        return base !== undefined ? base : (fallback !== undefined ? fallback : keyPath);
    }
}

const DIFFICULTY_ORDER = ['easy', 'normal', 'hard'];

class QuestionManager {
    constructor(questionSets = []) {
        this.questionSets = questionSets;
        this.cache = new Map();
    }

    _key(grade, subject, lang) {
        return `${grade}-${subject}-${lang}`;
    }

    loadQuestions({ grade, subject, lang }) {
        const cacheKey = this._key(grade, subject, lang);
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        const questions = this.questionSets
            .filter(item => item.grade === grade && item.subject === subject && item.translations && item.translations[lang])
            .map(item => {
                const localized = item.translations[lang];
                return {
                    id: `${item.subject}-${lang}-${item.grade}-${item.suffix || '0000'}`,
                    grade: item.grade,
                    subject: item.subject,
                    type: item.type,
                    difficulty: item.difficulty,
                    lang,
                    prompt: localized.prompt,
                    choices: Array.isArray(localized.choices) ? [...localized.choices] : [],
                    answer: localized.answer,
                    explanation: localized.explanation,
                    hints: Array.isArray(localized.hints) ? [...localized.hints] : [],
                    tts: localized.tts ? { ...localized.tts } : null,
                    suffix: item.suffix || '0000'
                };
            });

        this.cache.set(cacheKey, questions);
        return questions;
    }

    getRandomQuestion({ grade, subject, lang, difficulty, questionTypes, excludeIds = [] }) {
        let pool = this.loadQuestions({ grade, subject, lang }).filter(question => !excludeIds.includes(question.id));
        if (Array.isArray(questionTypes) && questionTypes.length > 0) {
            pool = pool.filter(question => questionTypes.includes(question.type));
        }
        if (pool.length === 0) {
            return null;
        }

        const order = difficulty
            ? [difficulty, ...DIFFICULTY_ORDER.filter(level => level !== difficulty)]
            : DIFFICULTY_ORDER;

        for (const level of order) {
            const candidates = pool.filter(question => question.difficulty === level);
            if (candidates.length > 0) {
                return candidates[Math.floor(Math.random() * candidates.length)];
            }
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }

    getQuestionForLanguage({ grade, subject, suffix, lang }) {
        const entry = this.questionSets.find(item => item.grade === grade && item.subject === subject && item.suffix === suffix);
        if (!entry || !entry.translations || !entry.translations[lang]) {
            return null;
        }
        const localized = entry.translations[lang];
        return {
            id: `${subject}-${lang}-${grade}-${suffix}`,
            grade,
            subject,
            type: entry.type,
            difficulty: entry.difficulty,
            lang,
            prompt: localized.prompt,
            choices: Array.isArray(localized.choices) ? [...localized.choices] : [],
            answer: localized.answer,
            explanation: localized.explanation,
            hints: Array.isArray(localized.hints) ? [...localized.hints] : [],
            tts: localized.tts ? { ...localized.tts } : null,
            suffix: suffix || '0000'
        };
    }

}

const KOKUGO_QUESTION_BANK = [
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0001",
    "type": "reading",
    "difficulty": "easy",
    "translations": {
      "ja": {
        "prompt": "「あめ」を漢字にしましょう。",
        "choices": ["雨", "飴", "雲", "風"],
        "answer": "雨",
        "explanation": "天気の「あめ」は漢字で「雨」と書きます。",
        "hints": ["天気に関係があります。", "空からふるものです。"],
        "tts": {"text": "「あめ」を漢字にしましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the kanji for 'ame' meaning rain.",
        "choices": ["雨", "飴", "雲", "風"],
        "answer": "雨",
        "explanation": "When 'ame' means rain we use the kanji 「雨」。",
        "hints": ["Think about weather words.", "It falls from the sky."],
        "tts": {"text": "Choose the kanji for ame meaning rain.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez le kanji pour « ame » (pluie).",
        "choices": ["雨", "飴", "雲", "風"],
        "answer": "雨",
        "explanation": "Le mot japonais « ame » (pluie) s'écrit avec le kanji 「雨」。",
        "hints": ["Pensez à la météo.", "Cela tombe du ciel."],
        "tts": {"text": "Choisissez le kanji pour ame signifiant pluie.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出代表「雨」意思的「ame」的漢字。",
        "choices": ["雨", "飴", "雲", "風"],
        "answer": "雨",
        "explanation": "當「ame」表示下雨時，要寫成漢字「雨」。",
        "hints": ["想一想天氣的詞語。", "它會從天空落下。"],
        "tts": {"text": "請選出代表雨意思的ame的漢字。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0002",
    "type": "kanji",
    "difficulty": "easy",
    "translations": {
      "ja": {
        "prompt": "「海」のよみかたを選びましょう。",
        "choices": ["うみ", "やま", "かわ", "そら"],
        "answer": "うみ",
        "explanation": "「海」は「うみ」と読みます。",
        "hints": ["水がたくさんあります。", "砂浜があります。"],
        "tts": {"text": "「海」のよみかたを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the reading for the kanji 「海」。",
        "choices": ["umi", "yama", "kawa", "sora"],
        "answer": "umi",
        "explanation": "The kanji 「海」 is read 'umi', meaning sea.",
        "hints": ["It is full of water.", "There is a beach."],
        "tts": {"text": "Choose the reading for the kanji umi.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez la lecture du kanji 「海」。",
        "choices": ["umi", "yama", "kawa", "sora"],
        "answer": "umi",
        "explanation": "Le kanji 「海」 se lit « umi », c'est la mer.",
        "hints": ["Il y a beaucoup d'eau.", "On y trouve une plage."],
        "tts": {"text": "Choisissez la lecture du kanji umi.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出漢字「海」的讀音。",
        "choices": ["うみ", "やま", "かわ", "そら"],
        "answer": "うみ",
        "explanation": "漢字「海」讀作「うみ」，意思是大海。",
        "hints": ["有很多水。", "有沙灘。"],
        "tts": {"text": "請選出漢字海的讀音。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0003",
    "type": "vocab",
    "difficulty": "easy",
    "translations": {
      "ja": {
        "prompt": "「元気」と近い意味のことばを選びましょう。",
        "choices": ["いきいき", "つかれ", "ねむたい", "さむい"],
        "answer": "いきいき",
        "explanation": "「元気」に近いことばは「いきいき」です。",
        "hints": ["明るく動きまわるようす。", "反対はつかれていること。"],
        "tts": {"text": "「元気」と近い意味のことばを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the word closest in meaning to 'genki' (lively).",
        "choices": ["lively", "tired", "sleepy", "cold"],
        "answer": "lively",
        "explanation": "'Genki' is closest to 'lively'.",
        "hints": ["Think of someone full of energy.", "The opposite is tired."],
        "tts": {"text": "Choose the word closest in meaning to genki.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez le mot qui signifie presque la même chose que « genki » (plein d'énergie).",
        "choices": ["plein d'énergie", "fatigué", "somnolent", "froid"],
        "answer": "plein d'énergie",
        "explanation": "« Genki » signifie « plein d'énergie ».",
        "hints": ["Imaginez quelqu'un plein d'entrain.", "Le contraire est fatigué."],
        "tts": {"text": "Choisissez le mot proche de genki.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出最接近「元気」意思的詞語。",
        "choices": ["有精神", "疲倦", "想睡", "寒冷"],
        "answer": "有精神",
        "explanation": "「元気」最接近「有精神」。",
        "hints": ["想像一個充滿活力的人。", "反義詞是疲倦。"],
        "tts": {"text": "請選出最接近元気意思的詞語。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0004",
    "type": "comprehension",
    "difficulty": "normal",
    "translations": {
      "ja": {
        "prompt": "はるとくんは朝早く起きて庭の花に水をやりました。花はうれしそうにかおをあげました。この文の主な内容として正しいものを選びましょう。",
        "choices": ["花に水をあげた", "花を切った", "花を売った", "花を食べた"],
        "answer": "花に水をあげた",
        "explanation": "文は花に水をあげたことを伝えています。",
        "hints": ["はるとくんは何をしましたか。", "花はどうなりましたか。"],
        "tts": {"text": "はるとくんは朝早く起きて庭の花に水をやりました。……正しい内容を選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Haruto woke up early and watered the flowers in the garden. The flowers lifted their heads happily. Choose the main idea of this passage.",
        "choices": ["He watered the flowers", "He cut the flowers", "He sold the flowers", "He ate the flowers"],
        "answer": "He watered the flowers",
        "explanation": "The passage describes Haruto watering the flowers.",
        "hints": ["What did Haruto do?", "How did the flowers react?"],
        "tts": {"text": "Haruto woke up early and watered the flowers in the garden. Choose the main idea.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Haruto s'est réveillé tôt et a arrosé les fleurs du jardin. Les fleurs ont levé la tête avec joie. Choisissez l'idée principale du texte.",
        "choices": ["Il a arrosé les fleurs", "Il a coupé les fleurs", "Il a vendu les fleurs", "Il a mangé les fleurs"],
        "answer": "Il a arrosé les fleurs",
        "explanation": "Le texte explique que Haruto a arrosé les fleurs.",
        "hints": ["Que fait Haruto ?", "Que se passe-t-il avec les fleurs ?"],
        "tts": {"text": "Haruto s'est réveillé tôt et a arrosé les fleurs. Choisissez l'idée principale.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "晴人一大早起來，為院子裡的花澆水。花兒高興地抬起頭。請選出這段文字的主要內容。",
        "choices": ["給花澆水", "把花剪掉", "把花賣掉", "把花吃掉"],
        "answer": "給花澆水",
        "explanation": "文章說明晴人為花澆水。",
        "hints": ["晴人做了什麼？", "花有什麼變化？"],
        "tts": {"text": "晴人一早起來為花澆水。請選主要內容。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0005",
    "type": "grammar",
    "difficulty": "normal",
    "translations": {
      "ja": {
        "prompt": "「わたし ___ がっこうにいきます。」に入る助詞を選びましょう。",
        "choices": ["は", "を", "で", "と"],
        "answer": "は",
        "explanation": "主語には「は」を使います。",
        "hints": ["主語を示す助詞です。", "「私は」が基本の形です。"],
        "tts": {"text": "「わたし ___ がっこうにいきます。」に入る助詞を選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the correct particle: 'Watashi ___ gakkou ni ikimasu.'",
        "choices": ["wa", "wo", "de", "to"],
        "answer": "wa",
        "explanation": "The topic marker 'wa' is used for the subject.",
        "hints": ["It marks the topic of the sentence.", "Think of the phrase 'Watashi wa'."],
        "tts": {"text": "Choose the correct particle for Watashi blank gakkou ni ikimasu.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez la particule correcte : « Watashi ___ gakkou ni ikimasu. »",
        "choices": ["wa", "wo", "de", "to"],
        "answer": "wa",
        "explanation": "La particule « wa » marque le sujet.",
        "hints": ["Elle marque le thème de la phrase.", "Pensez à « Watashi wa »."],
        "tts": {"text": "Choisissez la particule pour Watashi blank gakkou ni ikimasu.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出正確的助詞：「わたし ___ がっこうにいきます。」",
        "choices": ["は", "を", "で", "と"],
        "answer": "は",
        "explanation": "主題助詞要用「は」。",
        "hints": ["表示句子的主題。", "想一想「わたしは」。"],
        "tts": {"text": "請選出正確的助詞 わたし blank がっこうにいきます。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0006",
    "type": "reading",
    "difficulty": "normal",
    "translations": {
      "ja": {
        "prompt": "「花火」のよみかたを選びましょう。",
        "choices": ["はなび", "ひはな", "はなお", "はひ"],
        "answer": "はなび",
        "explanation": "「花火」は「はなび」と読みます。",
        "hints": ["夏のお祭りで見ます。", "夜空にひかります。"],
        "tts": {"text": "「花火」のよみかたを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the reading for 「花火」。",
        "choices": ["hanabi", "hihana", "hanao", "hahi"],
        "answer": "hanabi",
        "explanation": "「花火」 is read 'hanabi', meaning fireworks.",
        "hints": ["Seen at summer festivals.", "It lights up the night sky."],
        "tts": {"text": "Choose the reading for hanabi.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez la lecture de 「花火」。",
        "choices": ["hanabi", "hihana", "hanao", "hahi"],
        "answer": "hanabi",
        "explanation": "「花火」 se lit « hanabi », ce sont les feux d'artifice.",
        "hints": ["On les voit aux festivals d'été.", "Elles illuminent le ciel nocturne."],
        "tts": {"text": "Choisissez la lecture de hanabi.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出「花火」的讀音。",
        "choices": ["はなび", "ひはな", "はなお", "はひ"],
        "answer": "はなび",
        "explanation": "「花火」讀作「はなび」，意思是煙火。",
        "hints": ["夏天祭典會看到。", "會在夜空中閃亮。"],
        "tts": {"text": "請選出花火的讀音。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0007",
    "type": "kanji",
    "difficulty": "hard",
    "translations": {
      "ja": {
        "prompt": "「まち」を漢字にしましょう。",
        "choices": ["町", "道", "森", "校"],
        "answer": "町",
        "explanation": "人がたくさんくらす「まち」は「町」と書きます。",
        "hints": ["家や店が並びます。", "駅があるところもあります。"],
        "tts": {"text": "「まち」を漢字にしましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Write the kanji for 'machi' (town).",
        "choices": ["町", "道", "森", "校"],
        "answer": "町",
        "explanation": "The kanji for a town, 'machi', is 「町」。",
        "hints": ["Many houses and shops.", "There might be a station."],
        "tts": {"text": "Write the kanji for machi meaning town.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Écrivez le kanji de « machi » (ville).",
        "choices": ["町", "道", "森", "校"],
        "answer": "町",
        "explanation": "Pour « machi » qui signifie ville, on écrit 「町」。",
        "hints": ["Beaucoup de maisons et de magasins.", "On peut y trouver une gare."],
        "tts": {"text": "Écrivez le kanji de machi signifiant ville.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請把「まち」寫成漢字。",
        "choices": ["町", "道", "森", "校"],
        "answer": "町",
        "explanation": "表示城鎮的「まち」要寫成「町」。",
        "hints": ["有很多房子和商店。", "有時會有車站。"],
        "tts": {"text": "請把まち寫成漢字。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0008",
    "type": "vocab",
    "difficulty": "hard",
    "translations": {
      "ja": {
        "prompt": "「弱い」の反対のことばを選びましょう。",
        "choices": ["強い", "おそい", "くらい", "にぶい"],
        "answer": "強い",
        "explanation": "「弱い」の反対語は「強い」です。",
        "hints": ["力があるようす。", "スポーツが得意な人を思い浮かべましょう。"],
        "tts": {"text": "「弱い」の反対のことばを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the antonym of 'weak'.",
        "choices": ["strong", "slow", "dark", "dull"],
        "answer": "strong",
        "explanation": "The opposite of weak is strong.",
        "hints": ["Think of someone with power.", "Imagine an athlete."],
        "tts": {"text": "Choose the antonym of weak.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez le contraire de « faible ».",
        "choices": ["fort", "lent", "sombre", "terne"],
        "answer": "fort",
        "explanation": "Le contraire de « faible » est « fort ».",
        "hints": ["Imaginez quelqu'un puissant.", "Pensez à un sportif."],
        "tts": {"text": "Choisissez le contraire de faible.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出「弱い」的反義詞。",
        "choices": ["強い", "遅い", "暗い", "鈍い"],
        "answer": "強い",
        "explanation": "「弱い」的反義詞是「強い」。",
        "hints": ["想一個很有力量的人。", "可以聯想到運動選手。"],
        "tts": {"text": "請選出弱い的反義詞。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0009",
    "type": "comprehension",
    "difficulty": "easy",
    "translations": {
      "ja": {
        "prompt": "ゆうきちゃんは図書館で本を借りました。家に帰るとすぐに読んで、感想を日記に書きました。ゆうきちゃんのようすとして正しいものを選びましょう。",
        "choices": ["本が好き", "運動が好き", "ねむたい", "おなかがすいた"],
        "answer": "本が好き",
        "explanation": "すぐに読み、感想を書いたので本が好きだと分かります。",
        "hints": ["図書館を利用しています。", "感想を書きました。"],
        "tts": {"text": "ゆうきちゃんは図書館で本を借りました……ゆうきちゃんのようすを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Yuuki borrowed a book from the library, read it right away, and wrote her thoughts in a diary. Choose what this shows about her.",
        "choices": ["She likes books", "She likes sports", "She is sleepy", "She is hungry"],
        "answer": "She likes books",
        "explanation": "Borrowing, reading quickly, and writing notes show she likes books.",
        "hints": ["She went to the library.", "She wrote impressions."],
        "tts": {"text": "Yuuki borrowed a book, read it immediately, and wrote in her diary. Choose what it shows.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Yuuki a emprunté un livre à la bibliothèque, l'a lu tout de suite puis a écrit ses impressions dans un journal. Choisissez ce que cela montre sur elle.",
        "choices": ["Elle aime les livres", "Elle aime le sport", "Elle est somnolente", "Elle a faim"],
        "answer": "Elle aime les livres",
        "explanation": "Lire immédiatement et écrire ses impressions montre qu'elle aime lire.",
        "hints": ["Elle utilise la bibliothèque.", "Elle écrit ses impressions."],
        "tts": {"text": "Yuuki a emprunté un livre et a écrit ses impressions. Choisissez ce que cela montre.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "優希從圖書館借了一本書，回家後馬上閱讀，並在日記寫下心得。請選出這表示她的哪種樣子。",
        "choices": ["喜歡書", "喜歡運動", "很想睡", "肚子餓"],
        "answer": "喜歡書",
        "explanation": "利用圖書館並快速閱讀還寫心得，表示她喜歡書。",
        "hints": ["她去圖書館借書。", "她寫下感想。"],
        "tts": {"text": "優希借書並馬上閱讀寫日記。請選出這代表什麼。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 2,
    "subject": "kokugo",
    "suffix": "0010",
    "type": "grammar",
    "difficulty": "hard",
    "translations": {
      "ja": {
        "prompt": "ことばをならべて正しい文にしましょう: しました / べんきょう / きょう / わたしは",
        "choices": ["わたしは きょう べんきょう しました", "べんきょう しました わたしは きょう", "きょう わたしは しました べんきょう", "しました べんきょう わたしは きょう"],
        "answer": "わたしは きょう べんきょう しました",
        "explanation": "主語の「わたしは」が最初に来るのが自然です。",
        "hints": ["まず主語を考えましょう。", "「べんきょうしました」は文の最後です。"],
        "tts": {"text": "ことばをならべて正しい文にしましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Reorder the words to make a correct sentence: studied / today / I / did",
        "choices": ["I studied today", "Studied I today", "Today I did studied", "Did studied today I"],
        "answer": "I studied today",
        "explanation": "English sentences begin with the subject 'I' followed by the verb.",
        "hints": ["Start with the subject.", "Place the time word after the verb."],
        "tts": {"text": "Reorder the words to make a correct sentence.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Remettez les mots dans l'ordre : aujourd'hui / j'ai / étudié",
        "choices": ["J'ai étudié aujourd'hui", "Étudié j'ai aujourd'hui", "Aujourd'hui j'ai étudié", "Ai étudié j'ai aujourd'hui"],
        "answer": "J'ai étudié aujourd'hui",
        "explanation": "La phrase correcte commence par le sujet puis le verbe.",
        "hints": ["Commencez par « j'ai ».", "L'adverbe de temps vient à la fin."],
        "tts": {"text": "Remettez les mots dans l'ordre pour former une phrase correcte.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請把詞語排成正確句子：今天 / 我 / 讀書了",
        "choices": ["我 今天 讀書了", "讀書了 我 今天", "今天 我 做了 讀書", "做了 讀書 今天 我"],
        "answer": "我 今天 讀書了",
        "explanation": "中文句子通常以主語開始，時間放在主語之後。",
        "hints": ["先放上主語。", "時間詞在主語之後。"],
        "tts": {"text": "請把詞語排成正確的句子。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0001",
    "type": "reading",
    "difficulty": "easy",
    "translations": {
      "ja": {
        "prompt": "「旅」のよみかたを選びましょう。",
        "choices": ["たび", "たびる", "りょ", "たびや"],
        "answer": "たび",
        "explanation": "「旅」は「たび」と読み、旅行のことです。",
        "hints": ["出かけることです。", "旅行とも言います。"],
        "tts": {"text": "「旅」のよみかたを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the reading for 「旅」。",
        "choices": ["tabi", "tabiru", "ryo", "tobiya"],
        "answer": "tabi",
        "explanation": "「旅」 is read 'tabi', meaning trip or journey.",
        "hints": ["It means going on a trip.", "Another word is travel."],
        "tts": {"text": "Choose the reading for tabi.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez la lecture de 「旅」。",
        "choices": ["tabi", "tabiru", "ryo", "tobiya"],
        "answer": "tabi",
        "explanation": "「旅」 se lit « tabi » et signifie voyage.",
        "hints": ["Cela signifie partir en voyage.", "On peut dire aussi voyage."],
        "tts": {"text": "Choisissez la lecture de tabi.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出「旅」的讀音。",
        "choices": ["たび", "たびる", "りょ", "たびや"],
        "answer": "たび",
        "explanation": "「旅」讀作「たび」，意思是旅行。",
        "hints": ["表示出去旅行。", "也可以說旅遊。"],
        "tts": {"text": "請選出旅的讀音。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0002",
    "type": "kanji",
    "difficulty": "easy",
    "translations": {
      "ja": {
        "prompt": "「ゆめ」を漢字にしましょう。",
        "choices": ["夢", "雪", "絵", "草"],
        "answer": "夢",
        "explanation": "寝ているときに見る「ゆめ」は「夢」と書きます。",
        "hints": ["ねているときに見ます。", "かなえると嬉しいもの。"],
        "tts": {"text": "「ゆめ」を漢字にしましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Write the kanji for 'yume' (dream).",
        "choices": ["夢", "雪", "絵", "草"],
        "answer": "夢",
        "explanation": "The word 'yume' meaning dream is written 「夢」。",
        "hints": ["You see it while sleeping.", "People want to achieve it."],
        "tts": {"text": "Write the kanji for yume meaning dream.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Écrivez le kanji de « yume » (rêve).",
        "choices": ["夢", "雪", "絵", "草"],
        "answer": "夢",
        "explanation": "Le mot « yume » (rêve) s'écrit 「夢」。",
        "hints": ["On le voit en dormant.", "On souhaite le réaliser."],
        "tts": {"text": "Écrivez le kanji de yume signifiant rêve.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請把「ゆめ」寫成漢字。",
        "choices": ["夢", "雪", "絵", "草"],
        "answer": "夢",
        "explanation": "表示夢想的「ゆめ」要寫成「夢」。",
        "hints": ["睡覺時會看到。", "達成後會開心。"],
        "tts": {"text": "請把ゆめ寫成漢字。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0003",
    "type": "vocab",
    "difficulty": "normal",
    "translations": {
      "ja": {
        "prompt": "「工夫」と近い意味のことばを選びましょう。",
        "choices": ["ひらめき", "なまけ", "むだ", "しっぱい"],
        "answer": "ひらめき",
        "explanation": "「工夫」はよい考えを出すことなので「ひらめき」が近い意味です。",
        "hints": ["頭を使って考えること。", "よいアイデア。"],
        "tts": {"text": "「工夫」と近い意味のことばを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the word closest in meaning to 'kufu' (ingenuity).",
        "choices": ["inspiration", "laziness", "waste", "mistake"],
        "answer": "inspiration",
        "explanation": "'Kufu' means coming up with a good idea, similar to inspiration.",
        "hints": ["Using your brain to solve something.", "Finding a clever idea."],
        "tts": {"text": "Choose the word closest to kufu meaning ingenuity.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez le mot proche de « kufu » (ingéniosité).",
        "choices": ["inspiration", "paresse", "gaspillage", "erreur"],
        "answer": "inspiration",
        "explanation": "« Kufu » signifie trouver une bonne idée, proche d'inspiration.",
        "hints": ["Utiliser sa tête pour résoudre un problème.", "Trouver une idée astucieuse."],
        "tts": {"text": "Choisissez le mot proche de kufu, ingéniosité.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出最接近「工夫」意思的詞語。",
        "choices": ["靈感", "偷懶", "浪費", "失敗"],
        "answer": "靈感",
        "explanation": "「工夫」是想出好點子的意思，最接近「靈感」。",
        "hints": ["動腦想辦法。", "找到巧妙的點子。"],
        "tts": {"text": "請選出最接近工夫意思的詞語。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0004",
    "type": "comprehension",
    "difficulty": "normal",
    "translations": {
      "ja": {
        "prompt": "あやかさんは町の歴史を調べるため、図書館で古い地図を探しました。見つけた地図を使って発表の準備をしています。この文から分かるあやかさんのようすとして正しいものを選びましょう。",
        "choices": ["調べ学習に熱心", "本を読んで眠くなった", "地図をなくした", "発表をやめた"],
        "answer": "調べ学習に熱心",
        "explanation": "地図を探し発表の準備をしているので、調べ学習に熱心です。",
        "hints": ["図書館で何をしましたか。", "発表の準備をしています。"],
        "tts": {"text": "あやかさんは町の歴史を調べるために図書館で古い地図を探しました……正しいものを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Ayaka searched the library for an old map to study the town's history and is preparing a presentation with it. What does this tell you about Ayaka?",
        "choices": ["She studies enthusiastically", "She fell asleep reading", "She lost the map", "She gave up the presentation"],
        "answer": "She studies enthusiastically",
        "explanation": "Searching for maps and preparing a talk shows she is eager to research.",
        "hints": ["What did she do at the library?", "Is she preparing something?"],
        "tts": {"text": "Ayaka searched for an old map and is preparing a presentation. Choose the best description.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Ayaka a cherché une vieille carte à la bibliothèque pour étudier l'histoire de la ville et prépare une présentation avec. Que cela montre-t-il ?",
        "choices": ["Elle est studieuse", "Elle s'est endormie en lisant", "Elle a perdu la carte", "Elle a abandonné la présentation"],
        "answer": "Elle est studieuse",
        "explanation": "Chercher une carte et préparer un exposé montre son sérieux.",
        "hints": ["Que fait-elle à la bibliothèque ?", "Prépare-t-elle quelque chose ?"],
        "tts": {"text": "Ayaka prépare un exposé avec une vieille carte. Choisissez ce que cela montre d'elle.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "綾香為了研究城鎮歷史，在圖書館尋找舊地圖，並用這張地圖準備發表。這表示綾香是怎樣的人？",
        "choices": ["認真研究", "讀書讀到想睡", "弄丟地圖", "放棄發表"],
        "answer": "認真研究",
        "explanation": "她積極找資料並準備發表，表示她很認真研究。",
        "hints": ["她在圖書館做了什麼？", "她是否在準備發表？"],
        "tts": {"text": "綾香為研究城鎮歷史準備發表。請選出正確描述。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0005",
    "type": "grammar",
    "difficulty": "normal",
    "translations": {
      "ja": {
        "prompt": "「雨がふっています ___ 今日は外で遊びません。」に入る言葉を選びましょう。",
        "choices": ["ので", "けれど", "そして", "それでも"],
        "answer": "ので",
        "explanation": "理由を表すには「ので」を使います。",
        "hints": ["理由を示す接続語です。", "前の文が理由です。"],
        "tts": {"text": "「雨がふっています ___ 今日は外で遊びません。」に入る言葉を選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the word that fits: 'It is raining ___ we will not play outside today.'",
        "choices": ["because", "but", "and then", "even so"],
        "answer": "because",
        "explanation": "We need a connector that gives a reason, like 'because'.",
        "hints": ["The second sentence is the result.", "Look for a reason connector."],
        "tts": {"text": "Choose the word for It is raining blank we will not play outside today.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez le mot qui convient : « Il pleut ___ aujourd'hui nous ne jouerons pas dehors. »",
        "choices": ["parce que", "mais", "et puis", "même ainsi"],
        "answer": "parce que",
        "explanation": "On cherche un mot qui exprime la raison : « parce que ».",
        "hints": ["La deuxième phrase est la conséquence.", "Cherchez un lien de cause."],
        "tts": {"text": "Choisissez le mot qui exprime la cause pour la phrase Il pleut...", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出適合的詞：「因為下雨了 ___ 今天不在外面玩。」",
        "choices": ["所以", "但是", "然後", "即使如此"],
        "answer": "所以",
        "explanation": "要表達原因和結果，需要用「所以」。",
        "hints": ["後半句是結果。", "找表示原因連接詞。"],
        "tts": {"text": "請選出適合因為下雨了 blank 今天不在外面玩的詞。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0006",
    "type": "reading",
    "difficulty": "hard",
    "translations": {
      "ja": {
        "prompt": "「緑道」のよみかたを選びましょう。",
        "choices": ["りょくどう", "みどりみち", "ろくどう", "とくどう"],
        "answer": "りょくどう",
        "explanation": "「緑道」は「りょくどう」と読み、木々がならぶ道のことです。",
        "hints": ["緑はみどりと読みます。", "道は「どう」。"],
        "tts": {"text": "「緑道」のよみかたを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the reading for 「緑道」。",
        "choices": ["ryokudou", "midorimichi", "rokudou", "tokudou"],
        "answer": "ryokudou",
        "explanation": "「緑道」 is read 'ryokudou', meaning a green walkway lined with trees.",
        "hints": ["Green is 'ryoku' here.", "The second kanji reads 'dou'."],
        "tts": {"text": "Choose the reading for ryokudou.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez la lecture de 「緑道」。",
        "choices": ["ryokudou", "midorimichi", "rokudou", "tokudou"],
        "answer": "ryokudou",
        "explanation": "「緑道」 se lit « ryokudou », une promenade bordée d'arbres.",
        "hints": ["Le kanji de vert se lit « ryoku ».", "Le second kanji se lit « dou »."],
        "tts": {"text": "Choisissez la lecture de ryokudou.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出「緑道」的讀音。",
        "choices": ["りょくどう", "みどりみち", "ろくどう", "とくどう"],
        "answer": "りょくどう",
        "explanation": "「緑道」讀作「りょくどう」，意思是綠蔭步道。",
        "hints": ["「緑」在這裡讀作りょく。", "「道」讀作どう。"],
        "tts": {"text": "請選出緑道的讀音。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0007",
    "type": "kanji",
    "difficulty": "hard",
    "translations": {
      "ja": {
        "prompt": "「まもる」を漢字にしましょう。",
        "choices": ["守る", "集る", "固る", "変る"],
        "answer": "守る",
        "explanation": "約束を守るなどの「まもる」は「守る」と書きます。",
        "hints": ["約束するときに使います。", "おまもりの「まも」。"],
        "tts": {"text": "「まもる」を漢字にしましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Write the kanji for 'mamoru' (to protect).",
        "choices": ["守る", "集る", "固る", "変る"],
        "answer": "守る",
        "explanation": "The verb 'mamoru' meaning to protect is written 「守る」。",
        "hints": ["Use it with promises.", "Think of a protective charm."],
        "tts": {"text": "Write the kanji for mamoru meaning to protect.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Écrivez le kanji de « mamoru » (protéger).",
        "choices": ["守る", "集る", "固る", "変る"],
        "answer": "守る",
        "explanation": "Le verbe « mamoru » (protéger) s'écrit 「守る」。",
        "hints": ["On l'emploie pour tenir une promesse.", "Pensez à une amulette protectrice."],
        "tts": {"text": "Écrivez le kanji de mamoru, protéger.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請把「まもる」寫成漢字。",
        "choices": ["守る", "集る", "固る", "変る"],
        "answer": "守る",
        "explanation": "表示保護的「まもる」要寫作「守る」。",
        "hints": ["常用在遵守約定時。", "聯想到護身符。"],
        "tts": {"text": "請把まもる寫成漢字。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0008",
    "type": "comprehension",
    "difficulty": "hard",
    "translations": {
      "ja": {
        "prompt": "少年は自分で調べたことをクラスで発表しました。みんなが静かに耳を傾けてくれたので、少年は胸があたたかくなりました。この文から分かる少年の気持ちとして正しいものを選びましょう。",
        "choices": ["うれしい", "かなしい", "おこっている", "こわがっている"],
        "answer": "うれしい",
        "explanation": "聞いてもらえて胸があたたかくなったので、うれしい気持ちです。",
        "hints": ["胸があたたかくなるのはどんな気持ち？", "発表はうまくいきましたか？"],
        "tts": {"text": "少年は自分で調べたことをクラスで発表しました……気持ちを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "A boy presented his research to the class. Everyone listened quietly, so his chest felt warm. What emotion does he feel?",
        "choices": ["happy", "sad", "angry", "afraid"],
        "answer": "happy",
        "explanation": "Feeling warm inside after a good presentation shows happiness.",
        "hints": ["A warm chest means a positive feeling.", "The presentation went well."],
        "tts": {"text": "A boy presented and everyone listened. Choose how he feels.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Un garçon a présenté ses recherches en classe. Tout le monde l'a écouté attentivement, et il a senti son cœur devenir chaud. Quelle émotion ressent-il ?",
        "choices": ["heureux", "triste", "en colère", "effrayé"],
        "answer": "heureux",
        "explanation": "Un cœur chaud après une présentation réussie indique la joie.",
        "hints": ["Un cœur chaud est un sentiment positif.", "L'exposé s'est bien passé."],
        "tts": {"text": "Un garçon a présenté son travail et tout le monde a écouté. Choisissez son émotion.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "少年向全班發表自己研究的內容。大家安靜地傾聽，他覺得心裡暖暖的。請選出他的感受。",
        "choices": ["開心", "難過", "生氣", "害怕"],
        "answer": "開心",
        "explanation": "發表成功又被傾聽，心裡覺得溫暖，就是開心。",
        "hints": ["心裡暖暖通常代表什麼情緒？", "發表是否順利？"],
        "tts": {"text": "少年發表後心裡暖暖的。請選出他的感受。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0009",
    "type": "vocab",
    "difficulty": "hard",
    "translations": {
      "ja": {
        "prompt": "「豊か」の反対のことばを選びましょう。",
        "choices": ["乏しい", "楽しい", "広い", "深い"],
        "answer": "乏しい",
        "explanation": "「豊か」の反対語は「乏しい」です。",
        "hints": ["物や心が少ないようす。", "ゆたかの逆を考えましょう。"],
        "tts": {"text": "「豊か」の反対のことばを選びましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Choose the antonym of 'abundant'.",
        "choices": ["scarce", "fun", "wide", "deep"],
        "answer": "scarce",
        "explanation": "The opposite of abundant is scarce.",
        "hints": ["Think about having very little.", "The reverse of plenty."],
        "tts": {"text": "Choose the antonym of abundant.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Choisissez le contraire de « abondant ».",
        "choices": ["rare", "amusant", "large", "profond"],
        "answer": "rare",
        "explanation": "Le contraire d'abondant est rare.",
        "hints": ["Imaginez qu'il y en a très peu.", "C'est l'inverse du plein."],
        "tts": {"text": "Choisissez le contraire d'abondant.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請選出「豊か」的反義詞。",
        "choices": ["乏しい", "楽しい", "広い", "深い"],
        "answer": "乏しい",
        "explanation": "「豊か」的反義詞是「乏しい」。",
        "hints": ["表示東西很少。", "想一想與富足相反。"],
        "tts": {"text": "請選出豊か的反義詞。", "lang": "zh-CN"}
      }
    }
  },
  {
    "grade": 3,
    "subject": "kokugo",
    "suffix": "0010",
    "type": "grammar",
    "difficulty": "hard",
    "translations": {
      "ja": {
        "prompt": "ことばをならべて正しい文にしましょう: 調べました / 自然について / わたしたちは / 新聞で",
        "choices": ["わたしたちは 新聞で 自然について 調べました", "自然について わたしたちは 新聞で 調べました", "新聞で 調べました わたしたちは 自然について", "調べました わたしたちは 新聞で 自然について"],
        "answer": "わたしたちは 新聞で 自然について 調べました",
        "explanation": "主語「わたしたちは」から始め、場所の「新聞で」、内容の「自然について」、最後に動詞が続きます。",
        "hints": ["主語を最初に置きましょう。", "動詞は文の最後です。"],
        "tts": {"text": "ことばをならべて正しい文にしましょう。", "lang": "ja-JP"}
      },
      "en": {
        "prompt": "Reorder the words: researched / about nature / we / in the newspaper",
        "choices": ["We researched about nature in the newspaper", "About nature we researched in the newspaper", "In the newspaper researched we about nature", "Researched we in the newspaper about nature"],
        "answer": "We researched about nature in the newspaper",
        "explanation": "Begin with the subject 'We', then the verb, then details.",
        "hints": ["Start with the subject.", "Keep the verb close to the subject."],
        "tts": {"text": "Reorder the words to make a correct sentence about researching nature.", "lang": "en-US"}
      },
      "fr": {
        "prompt": "Remettez les mots dans l'ordre : nous / avons recherché / sur la nature / dans le journal",
        "choices": ["Nous avons recherché sur la nature dans le journal", "Sur la nature nous avons recherché dans le journal", "Dans le journal nous avons recherché sur la nature", "Avons recherché nous sur la nature dans le journal"],
        "answer": "Nous avons recherché sur la nature dans le journal",
        "explanation": "La phrase correcte commence par « nous avons recherché ».",
        "hints": ["Commencez par le sujet.", "Le verbe suit immédiatement."],
        "tts": {"text": "Remettez les mots pour former une phrase correcte sur la recherche dans le journal.", "lang": "fr-FR"}
      },
      "zh": {
        "prompt": "請排成正確句子：我們 / 在報紙上 / 調查了 / 關於自然",
        "choices": ["我們 在報紙上 調查了 關於自然", "關於自然 我們 在報紙上 調查了", "在報紙上 調查了 我們 關於自然", "調查了 我們 在報紙上 關於自然"],
        "answer": "我們 在報紙上 調查了 關於自然",
        "explanation": "中文句子以主語開頭，接著是地點和動作。",
        "hints": ["先把主語放前面。", "動作放在時間或地點之後。"],
        "tts": {"text": "請把詞語排成正確描述研究自然的句子。", "lang": "zh-CN"}
      }
    }
  }

];

const questionManager = new QuestionManager(KOKUGO_QUESTION_BANK);

const SUPPORTED_LANGUAGES = ['ja', 'en', 'fr', 'zh'];

const KOKUGO_TYPES = ['reading', 'kanji', 'vocab', 'comprehension', 'grammar'];

const createEmptyLanguageStats = () => {
    const baseline = {};
    SUPPORTED_LANGUAGES.forEach(lang => {
        baseline[lang] = {
            answered: 0,
            correct: 0,
            comprehensionAnswered: 0,
            comprehensionCorrect: 0,
            streak: 0
        };
    });
    return baseline;
};

const LANGUAGE_LABELS = { ja: '日本語', en: 'English', fr: 'Français', zh: '中文' };

const createDefaultPlayerStats = () => ({
    totalMonstersDefeated: 0,
    totalQuestionsAnswered: 0,
    correctAnswers: 0,
    unlockedMonsters: [],
    badges: [],
    languageStats: {
        kokugo: createEmptyLanguageStats(),
        math: createEmptyLanguageStats()
    },
    achievements: {
        langNovice: false,
        readingChamp: false,
        bugCatcher: false
    },
    capturedInsects: []
});

const normalizePlayerStats = (raw) => {
    const defaults = createDefaultPlayerStats();
    if (!raw || typeof raw !== 'object') {
        return defaults;
    }

    const normalizeLang = (source) => {
        const base = createEmptyLanguageStats();
        Object.keys(base).forEach(lang => {
            const info = source && source[lang] ? source[lang] : {};
            base[lang] = {
                answered: Number(info.answered) || 0,
                correct: Number(info.correct) || 0,
                comprehensionAnswered: Number(info.comprehensionAnswered) || 0,
                comprehensionCorrect: Number(info.comprehensionCorrect) || 0,
                streak: Number(info.streak) || 0
            };
        });
        return base;
    };

    return {
        ...defaults,
        ...raw,
        badges: Array.isArray(raw.badges) ? Array.from(new Set(raw.badges)) : defaults.badges.slice(),
        languageStats: {
            kokugo: normalizeLang(raw.languageStats && raw.languageStats.kokugo),
            math: normalizeLang(raw.languageStats && raw.languageStats.math)
        },
        achievements: {
            ...defaults.achievements,
            ...(raw.achievements || {})
        },
        capturedInsects: Array.isArray(raw.capturedInsects) ? raw.capturedInsects : defaults.capturedInsects.slice()
    };
};

const MathMazeGame = () => {
    // Language settings
    // Translations (all languages)
    const translations = useMemo(() => ({
        ja: {
            gameTitle: 'さんすうダンジョン',
            startGame: 'ゲームスタート！',
            stats: 'せいせき',
            dictionary: 'モンスターずかん',
            selectGrade: 'がくねんを えらぼう！',
            grade2Mode: '2年生モード',
            grade3Mode: '3年生モード',
            studyContent: 'べんきょうする内容：',
            modeSelectTitle: 'モードをえらぼう',
            focusSkillsTitle: 'フォーカスするスキル',
            worldsTitle: '冒険できるフィールド',
            modeDungeon: 'ダンジョン冒険',
            modeDungeonDescription: '迷路を探検してモンスターと計算バトル！',
            modeMiniGames: 'トレーニングゲーム',
            modeMiniGamesDescription: '得意スキルをミニゲームで鍛えよう。',
            modeStory: 'ストーリークエスト',
            modeStoryDescription: '物語を読み進めて図鑑を充実させよう。',
            modeCoop: '協力ミッション',
            modeCoopDescription: '友だちとヒントを出し合ってチャレンジ。',
            modeVersus: 'たいせんモード',
            modeVersusDescription: '同じ問題でスピードと正確さを競おう。',
            modeParent: '保護者ダッシュボード',
            modeParentDescription: '学習状況やバッジを確認できます。',
            storyBegin: '物語をひらく',
            viewStory: 'ストーリーを見る',
            answer: 'こたえ',
            miniGameTitle: 'スキル特訓ゲーム',
            miniGameStart: 'スタート',
            miniGameSkill: '対応スキル',
            progress: '進行',
            completeStory: 'クリアとして記録',
            storyLocked: '新しい章が解放されました！',
            launchCoop: 'ミッションスタート',
            launchVersus: 'たいせん開始',
            parentDashboard: '保護者ダッシュボード',
            miniGameStat: 'ミニゲームの記録',
            weeklyProgress: '週間のがんばり',
            backToModes: 'モード選択にもどる',

            addition: 'たし算',
            subtraction: 'ひき算',
            comparison: '数の大小くらべ',
            additionCarryHint: 'くり上がりを意識して一桁ずつ計算しよう。',
            subtractionBorrowHint: '上の位から借りて、順番に計算しよう。',
            coinGamePrompt: '{expression}',
            coinHint: '硬貨の値段を足してね。',
            currencySymbol: '¥',
            clockMatchPrompt: '時計合わせ',
            clockHint: '短い針で時間、長い針で分を読むよ。',
            evenLabel: '偶数',
            oddLabel: '奇数',
            parityBoth: 'どちらも',
            parityNeither: 'どちらでもない',
            evenOddHint: '1の位が0,2,4,6,8なら偶数だよ。',
            arrayHint: '行と列でかけ算を考えよう。',
            divisionHint: 'かけ算の逆を考えてね。',
            wordProblemHint: '文章から式を作ろう。',
            unitConversionPrompt: '単位を変換しよう',
            unitConversionHint: '決まった倍率をかけるか割ろう。',
            dataReadingPrompt: '一番多いのはどれ？',
            dataReadingHint: '数字や棒グラフを比べよう。',
            multiplication: 'かけ算（九九）',
            division: 'わり算（あまりなし）',
            back: 'もどる',
            submit: 'けってい',
            level: 'レベル',
            defeated: 'たおした',
            timeLeft: 'のこり時間',
            seconds: '秒',
            correct: 'せいかい！すごいね！',
            incorrect: 'ざんねん！もういちど！',
            timeUp: 'じかんぎれ！もういちど！',
            wall: 'かべだよ！べつの道をさがそう！',
            gateBlocked: 'ボスをたおさないと とおれない！',
            gateOpened: 'ゲートがひらいた！',
            bossDefeated: 'ボスをたおした！ゲートがひらくよ！',
            monsterDefeated: 'をたおした！',
            levelClear: 'レベル',
            clearMessage: 'クリア！',
            nextLevel: 'つぎのレベルへ！',
            menu: 'メニューへ',
            becomeHero: 'さんすう勇者になって',
            conquerDungeon: 'ダンジョンを制覇しよう！',
            dungeonExploring: 'ダンジョン探索中',
            bossBattle: 'ボスバトル！',
            appeared: 'があらわれた！',
            bossWarning: 'このボスをたおさないと ゴールできない！',
            defeatedBoss: 'ボスをたおした！ゴールへ向かおう！',
            needDefeatBoss: 'ボスをたおさないとゴールできない！',
            you: 'じぶん',
            monster: 'モンスター',
            boss: 'ボス',
            gate: 'ゲート',
            goal: 'ゴール',
            totalDefeated: 'ぜんぶでたおしたモンスター',
            totalQuestions: 'といたもんだい',
            correctAnswers: 'せいかいしたもんだい',
            accuracy: 'せいかい率',
            congratulations: 'おめでとう！',
            yourStats: 'きみのせいせき',
            found: 'みつけた',
            notFound: 'まだみつけていないよ',
            hp: 'たいりょく',
            whichBigger: 'どちらが大きい？',
            body: '体',
            question: '問',
            badges: 'バッジ',
            firstClear: 'はじめてのクリア',
            perfectClear: 'パーフェクト',
            multiplicationMaster: '九九マスター',
            typesOfMonsters: 'しゅるいのモンスター',
            hint: 'ヒント: じぶんの学年にあったモードをえらぼう！',
            viewHint: 'ヒントをみる',
            hideHint: 'ヒントを隠す',
            insectMission: '虫取りミッション',
            selectArea: 'エリアを選ぼう',
            urawa: '浦和',
            omiya: '大宮',
            iwatsuki: '岩槻',
            cicada: 'セミ',
            cicadaFact: '大宮公園ではセミがたくさん鳴いているよ。',
            beetle: 'カブトムシ',
            beetleFact: '浦和ではカブトムシが人気だよ。',
            dragonfly: 'トンボ',
            dragonflyFact: '見沼田んぼではトンボが飛び回っているよ。',
            attemptCapture: '捕獲に挑戦',
            captureInsect: '虫を捕まえよう',
            captureSuccess: '捕獲成功！',
            captureFail: '逃げられた！',
            subjectSelect: '学習したいモードを選ぼう',
            subjectMath: '算数ダンジョン',
            subjectMathDescription: '迷路を進みながら計算バトルに挑戦。',
            subjectKokugo: '国語アドベンチャー',
            subjectKokugoDescription: '読み取り・漢字・語彙・文法を楽しみながら学ぶモードです。',
            startKokugo: '国語クイズを始める',
            kokugoIntro: '学年と難易度を選んで国語の冒険をはじめよう。',
            studyLanguageLabel: '挑戦する言語',
            nativeLanguageLabel: 'サポート言語',
            swapLanguages: '言語を入れ替える',
            difficultyEasy: 'やさしい',
            difficultyNormal: 'ふつう',
            difficultyHard: 'むずかしい',
            questionTypeReading: '読み',
            questionTypeKanji: '漢字',
            questionTypeVocab: '語彙',
            questionTypeComprehension: '読解',
            questionTypeGrammar: '文法',
            questionProgress: '{current}/{total}問目',
            hintsRemaining: 'ヒント {remaining}/{total}',
            ttsPlay: '読み上げ',
            ttsStop: '停止',
            supportPrompt: 'ヒント ({lang})',
            kokugoSummaryTitle: '国語チャレンジの結果',
            kokugoSummaryAccuracy: '正答率',
            kokugoSummaryCorrect: '正解数',
            kokugoSummaryAgain: 'もう一度挑戦',
            kokugoSummaryMenu: 'メニューに戻る',
            kokugoSummaryDetails: '今回の見直し',
            nextQuestion: '次の問題へ',
            kokugoViewResults: '結果を見る',
            kokugoNoQuestions: '選択した条件の問題が見つかりませんでした。',
            languageStatsTitle: '言語ごとの学習記録',
            languageStatsDescription: '科目と言語ごとの正答状況',
            languageColumn: '言語',
            subjectColumn: '科目',
            answeredColumn: '解答数',
            correctColumn: '正解数',
            accuracyColumn: '正答率',
            comprehensionAccuracy: '読解の正答率',
            badgeLangNovice: 'Lang Novice',
            badgeReadingChamp: 'Reading Champ',
            badgeBugCatcher: 'Bug Catcher',
        },
        en: {
            gameTitle: 'Math Dungeon',
            startGame: 'Start Game!',
            stats: 'Statistics',
            dictionary: 'Monster Guide',
            selectGrade: 'Choose Your Grade!',
            grade2Mode: 'Grade 2 Mode',
            grade3Mode: 'Grade 3 Mode',
            studyContent: 'What to Study:',
            modeSelectTitle: 'Choose your next adventure',
            focusSkillsTitle: 'Focus skills',
            worldsTitle: 'Theme worlds',
            modeDungeon: 'Dungeon Adventure',
            modeDungeonDescription: 'Explore procedurally generated mazes and defeat monsters.',
            modeMiniGames: 'Skill Mini Games',
            modeMiniGamesDescription: 'Play targeted puzzles to build mastery.',
            modeStory: 'Story Quest',
            modeStoryDescription: 'Unlock narrative chapters and lore.',
            modeCoop: 'Co-op Mission',
            modeCoopDescription: 'Team up with a buddy to clear tough challenges.',
            modeVersus: 'Versus Arena',
            modeVersusDescription: 'Race on the same problems and compare scores.',
            modeParent: 'Parent Dashboard',
            modeParentDescription: 'Review progress, badges, and set rewards.',
            storyBegin: 'Unlock chapter',
            viewStory: 'View chapter',
            answer: 'Answer',
            miniGameTitle: 'Mini games',
            miniGameStart: 'Start',
            miniGameSkill: 'Skill focus',
            progress: 'Progress',
            completeStory: 'Mark chapter complete',
            storyLocked: 'New chapter unlocked!',
            launchCoop: 'Start mission',
            launchVersus: 'Start match',
            parentDashboard: 'Parent Dashboard',
            miniGameStat: 'Mini game records',
            weeklyProgress: 'Weekly progress',
            backToModes: 'Back to mode select',

            addition: 'Addition',
            subtraction: 'Subtraction',
            comparison: 'Number Comparison',
            additionCarryHint: 'Regroup the ones place to form a new ten.',
            subtractionBorrowHint: 'Borrow from the next place value when needed.',
            coinGamePrompt: '{expression}',
            coinHint: 'Add each coin value.',
            currencySymbol: '$',
            clockMatchPrompt: 'Match the clock',
            clockHint: 'Read hour first, then minutes.',
            evenLabel: 'Even',
            oddLabel: 'Odd',
            parityBoth: 'Both',
            parityNeither: 'Neither',
            evenOddHint: 'Look at the ones digit.',
            arrayHint: 'Think rows times columns.',
            divisionHint: 'Division is the inverse of multiplication.',
            wordProblemHint: 'Turn the story into an equation.',
            unitConversionPrompt: 'Convert the unit',
            unitConversionHint: 'Multiply or divide by the conversion factor.',
            dataReadingPrompt: 'Which bar is the tallest?',
            dataReadingHint: 'Compare each value carefully.',
            multiplication: 'Multiplication',
            division: 'Division',
            back: 'Back',
            submit: 'Submit',
            level: 'Level',
            defeated: 'Defeated',
            timeLeft: 'Time Left',
            seconds: 'sec',
            correct: 'Correct! Great job!',
            incorrect: 'Try again!',
            timeUp: "Time's up! Try again!",
            wall: "It's a wall! Find another way!",
            gateBlocked: 'Defeat the boss to pass!',
            gateOpened: 'Gate opened!',
            bossDefeated: 'Boss defeated! Gate will open!',
            monsterDefeated: ' defeated!',
            levelClear: 'Level',
            clearMessage: 'Clear!',
            nextLevel: 'Next Level!',
            menu: 'Menu',
            becomeHero: 'Become a Math Hero',
            conquerDungeon: 'Conquer the Dungeon!',
            dungeonExploring: 'Exploring Dungeon',
            bossBattle: 'Boss Battle!',
            appeared: ' appeared!',
            bossWarning: 'Defeat this boss to reach the goal!',
            defeatedBoss: 'Boss defeated! Head to the goal!',
            needDefeatBoss: 'Defeat the boss to reach the goal!',
            you: 'You',
            monster: 'Monster',
            boss: 'Boss',
            gate: 'Gate',
            goal: 'Goal',
            totalDefeated: 'Total Monsters Defeated',
            totalQuestions: 'Questions Answered',
            correctAnswers: 'Correct Answers',
            accuracy: 'Accuracy',
            congratulations: 'Congratulations!',
            yourStats: 'Your Statistics',
            found: 'Found',
            notFound: 'Not discovered yet',
            hp: 'HP',
            whichBigger: 'Which is bigger?',
            body: ' monsters',
            question: ' questions',
            badges: 'Badges',
            firstClear: 'First Clear',
            perfectClear: 'Perfect',
            multiplicationMaster: 'Times Table Master',
            typesOfMonsters: 'types of monsters',
            hint: 'Hint: Choose the mode for your grade level!',
            viewHint: 'Show Hint',
            hideHint: 'Hide Hint',
            insectMission: 'Insect Mission',
            selectArea: 'Select Area',
            urawa: 'Urawa',
            omiya: 'Omiya',
            iwatsuki: 'Iwatsuki',
            cicada: 'Cicada',
            cicadaFact: 'Many cicadas sing in Omiya Park.',
            beetle: 'Beetle',
            beetleFact: 'Beetles are popular in Urawa.',
            dragonfly: 'Dragonfly',
            dragonflyFact: 'Dragonflies fly around Minuma Tambo.',
            attemptCapture: 'Attempt Capture',
            captureInsect: 'Catch the insect',
            captureSuccess: 'Captured!',
            captureFail: 'It escaped!',
            subjectSelect: 'Choose your learning path',
            subjectMath: 'Math Dungeon',
            subjectMathDescription: 'Solve puzzles and conquer monsters with math.',
            subjectKokugo: 'Kokugo Quest',
            subjectKokugoDescription: 'Practice Japanese reading, kanji, vocabulary, and comprehension.',
            startKokugo: 'Start Kokugo Practice',
            kokugoIntro: 'Pick a grade and difficulty to begin the language challenge.',
            studyLanguageLabel: 'Challenge language',
            nativeLanguageLabel: 'Support language',
            swapLanguages: 'Swap languages',
            difficultyEasy: 'Easy',
            difficultyNormal: 'Normal',
            difficultyHard: 'Hard',
            questionTypeReading: 'Reading',
            questionTypeKanji: 'Kanji',
            questionTypeVocab: 'Vocabulary',
            questionTypeComprehension: 'Comprehension',
            questionTypeGrammar: 'Grammar',
            questionProgress: 'Question {current} of {total}',
            hintsRemaining: 'Hints {remaining}/{total}',
            ttsPlay: 'Read aloud',
            ttsStop: 'Stop reading',
            supportPrompt: 'Hint ({lang})',
            kokugoSummaryTitle: 'Kokugo Challenge Results',
            kokugoSummaryAccuracy: 'Accuracy',
            kokugoSummaryCorrect: 'Correct Answers',
            kokugoSummaryAgain: 'Try again',
            kokugoSummaryMenu: 'Back to menu',
            kokugoSummaryDetails: 'Review your answers',
            nextQuestion: 'Next Question',
            kokugoViewResults: 'View Results',
            kokugoNoQuestions: 'No questions available for the selected options.',
            languageStatsTitle: 'Language Progress',
            languageStatsDescription: 'Accuracy by subject and language',
            languageColumn: 'Language',
            subjectColumn: 'Subject',
            answeredColumn: 'Answered',
            correctColumn: 'Correct',
            accuracyColumn: 'Accuracy',
            comprehensionAccuracy: 'Comprehension accuracy',
            badgeLangNovice: 'Lang Novice',
            badgeReadingChamp: 'Reading Champ',
            badgeBugCatcher: 'Bug Catcher',
        },
        fr: {
            gameTitle: 'Donjon des Maths',
            startGame: 'Commencer!',
            stats: 'Statistiques',
            dictionary: 'Guide des Monstres',
            selectGrade: 'Choisissez votre niveau!',
            grade2Mode: 'Mode 2e année',
            grade3Mode: 'Mode 3e année',
            studyContent: 'À étudier:',
            addition: 'Addition',
            subtraction: 'Soustraction',
            comparison: 'Comparaison',
            additionCarryHint: 'Addition avec retenue : pense à former une dizaine.',
            subtractionBorrowHint: 'Emprunte dans la colonne suivante si besoin.',
            coinGamePrompt: '{expression}',
            coinHint: 'Additionne la valeur de chaque pièce.',
            currencySymbol: '€',
            clockMatchPrompt: 'Remets l\'horloge',
            clockHint: 'Lis l\'heure puis les minutes.',
            evenLabel: 'Pair',
            oddLabel: 'Impair',
            parityBoth: 'Les deux',
            parityNeither: 'Aucun',
            evenOddHint: 'Observe le chiffre des unités.',
            arrayHint: 'Utilise lignes et colonnes.',
            divisionHint: 'La division est l\'inverse de la multiplication.',
            wordProblemHint: 'Transforme l\'histoire en équation.',
            unitConversionPrompt: 'Convertis l\'unité',
            unitConversionHint: 'Multiplie ou divise par le facteur.',
            dataReadingPrompt: 'Quelle valeur est la plus grande ?',
            dataReadingHint: 'Compare chaque barre attentivement.',
            multiplication: 'Multiplication',
            division: 'Division',
            back: 'Retour',
            submit: 'Valider',
            level: 'Niveau',
            defeated: 'Vaincus',
            timeLeft: 'Temps restant',
            seconds: 'sec',
            correct: 'Correct! Bravo!',
            incorrect: 'Essaie encore!',
            timeUp: 'Temps écoulé!',
            wall: "C'est un mur!",
            gateBlocked: 'Vaincs le boss pour passer!',
            gateOpened: 'Porte ouverte!',
            bossDefeated: 'Boss vaincu!',
            monsterDefeated: ' vaincu!',
            levelClear: 'Niveau',
            clearMessage: 'Réussi!',
            nextLevel: 'Niveau suivant!',
            menu: 'Menu',
            becomeHero: 'Deviens un héros des maths',
            conquerDungeon: 'Conquiers le donjon!',
            dungeonExploring: 'Exploration du donjon',
            bossBattle: 'Combat de boss!',
            appeared: ' est apparu!',
            bossWarning: 'Vaincs ce boss pour atteindre le but!',
            defeatedBoss: 'Boss vaincu! Dirige-toi vers le but!',
            needDefeatBoss: 'Vaincs le boss pour atteindre le but!',
            you: 'Toi',
            monster: 'Monstre',
            boss: 'Boss',
            gate: 'Porte',
            goal: 'But',
            totalDefeated: 'Total de monstres vaincus',
            totalQuestions: 'Questions répondues',
            correctAnswers: 'Bonnes réponses',
            accuracy: 'Précision',
            congratulations: 'Félicitations!',
            yourStats: 'Tes Statistiques',
            found: 'Trouvé',
            notFound: 'Pas encore découvert',
            hp: 'PV',
            whichBigger: 'Lequel est plus grand?',
            body: ' monstres',
            question: ' questions',
            badges: 'Badges',
            firstClear: 'Première victoire',
            perfectClear: 'Parfait',
            multiplicationMaster: 'Maître des tables',
            typesOfMonsters: 'types de monstres',
            hint: 'Astuce: Choisis le mode pour ton niveau!',
            viewHint: "Voir l'indice",
            hideHint: "Cacher l'indice",
            insectMission: 'Mission Insecte',
            selectArea: 'Choisir une zone',
            urawa: 'Urawa',
            omiya: 'Omiya',
            iwatsuki: 'Iwatsuki',
            cicada: 'Cigale',
            cicadaFact: 'Beaucoup de cigales chantent au parc Omiya.',
            beetle: 'Scarabée',
            beetleFact: 'Les scarabées sont populaires à Urawa.',
            dragonfly: 'Libellule',
            dragonflyFact: 'Les libellules volent autour de Minuma Tambo.',
            attemptCapture: 'Tenter la capture',
            captureInsect: "Attrape l'insecte",
            captureSuccess: 'Capturé!',
            captureFail: 'S\'est échappé!',
            subjectSelect: 'Choisis ta matière',
            subjectMath: 'Donjon des maths',
            subjectMathDescription: 'Résous des énigmes et bats les monstres avec les calculs.',
            subjectKokugo: 'Quête de kokugo',
            subjectKokugoDescription: 'Travaille la lecture, les kanjis, le vocabulaire et la compréhension.',
            startKokugo: 'Commencer le kokugo',
            kokugoIntro: 'Choisis une classe et une difficulté pour démarrer le défi de langue.',
            studyLanguageLabel: 'Langue de défi',
            nativeLanguageLabel: 'Langue de soutien',
            swapLanguages: 'Inverser les langues',
            difficultyEasy: 'Facile',
            difficultyNormal: 'Normal',
            difficultyHard: 'Difficile',
            questionTypeReading: 'Lecture',
            questionTypeKanji: 'Kanji',
            questionTypeVocab: 'Vocabulaire',
            questionTypeComprehension: 'Compréhension',
            questionTypeGrammar: 'Grammaire',
            questionProgress: 'Question {current}/{total}',
            hintsRemaining: 'Indices {remaining}/{total}',
            ttsPlay: 'Lecture audio',
            ttsStop: 'Arrêter l\'audio',
            supportPrompt: 'Indice ({lang})',
            kokugoSummaryTitle: 'Résultats du défi de kokugo',
            kokugoSummaryAccuracy: 'Précision',
            kokugoSummaryCorrect: 'Bonnes réponses',
            kokugoSummaryAgain: 'Recommencer',
            kokugoSummaryMenu: 'Retour au menu',
            kokugoSummaryDetails: 'Révision des réponses',
            nextQuestion: 'Question suivante',
            kokugoViewResults: 'Voir les résultats',
            kokugoNoQuestions: 'Aucune question disponible pour ces options.',
            languageStatsTitle: 'Progression par langue',
            languageStatsDescription: 'Taux de réussite par matière et langue',
            languageColumn: 'Langue',
            subjectColumn: 'Matière',
            answeredColumn: 'Répondu',
            correctColumn: 'Correct',
            accuracyColumn: 'Précision',
            comprehensionAccuracy: 'Précision compréhension',
            badgeLangNovice: 'Lang Novice',
            badgeReadingChamp: 'Reading Champ',
            badgeBugCatcher: 'Bug Catcher',
        },
        zh: {
            gameTitle: '数学地牢',
            startGame: '开始游戏！',
            stats: '统计',
            dictionary: '怪物图鉴',
            selectGrade: '选择年级！',
            grade2Mode: '二年级模式',
            grade3Mode: '三年级模式',
            studyContent: '学习内容：',
            addition: '加法',
            subtraction: '减法',
            comparison: '数字比较',
            additionCarryHint: '注意进位，把个位先加起来。',
            subtractionBorrowHint: '需要时向前一位借1再减。',
            coinGamePrompt: '{expression}',
            coinHint: '把每个硬币的金额相加。',
            currencySymbol: '¥',
            clockMatchPrompt: '调准时钟',
            clockHint: '先看时针，再看分针。',
            evenLabel: '偶数',
            oddLabel: '奇数',
            parityBoth: '都可以',
            parityNeither: '都不是',
            evenOddHint: '看个位数字是否为0,2,4,6,8。',
            arrayHint: '用行和列来想乘法。',
            divisionHint: '除法是乘法的逆运算。',
            wordProblemHint: '把故事转成算式。',
            unitConversionPrompt: '换算单位',
            unitConversionHint: '乘或除以换算系数。',
            dataReadingPrompt: '哪个值最大？',
            dataReadingHint: '仔细比较每个数字或条形图。',
            multiplication: '乘法',
            division: '除法',
            back: '返回',
            submit: '提交',
            level: '关卡',
            defeated: '击败',
            timeLeft: '剩余时间',
            seconds: '秒',
            correct: '正确！太棒了！',
            incorrect: '再试一次！',
            timeUp: '时间到！',
            wall: '是墙！',
            gateBlocked: '击败boss才能通过！',
            gateOpened: '大门打开了！',
            bossDefeated: 'Boss被击败！',
            monsterDefeated: '被击败！',
            levelClear: '关卡',
            clearMessage: '通关！',
            nextLevel: '下一关！',
            menu: '菜单',
            becomeHero: '成为数学英雄',
            conquerDungeon: '征服地牢！',
            dungeonExploring: '探索地牢中',
            bossBattle: 'Boss战！',
            appeared: '出现了！',
            bossWarning: '击败这个boss才能到达终点！',
            defeatedBoss: 'Boss被击败！前往终点！',
            needDefeatBoss: '击败boss才能到达终点！',
            you: '你',
            monster: '怪物',
            boss: 'Boss',
            gate: '大门',
            goal: '终点',
            totalDefeated: '击败怪物总数',
            totalQuestions: '回答问题数',
            correctAnswers: '正确答案数',
            accuracy: '正确率',
            congratulations: '恭喜！',
            yourStats: '你的统计',
            found: '已发现',
            notFound: '尚未发现',
            hp: '生命值',
            whichBigger: '哪个更大？',
            body: '只',
            question: '题',
            badges: '徽章',
            firstClear: '首次通关',
            perfectClear: '完美',
            multiplicationMaster: '九九表大师',
            typesOfMonsters: '种怪物',
            hint: '提示：选择适合你年级的模式！',
            viewHint: '查看提示',
            hideHint: '隐藏提示',
            insectMission: '捕虫任务',
            selectArea: '选择地区',
            urawa: '浦和',
            omiya: '大宫',
            iwatsuki: '岩槻',
            cicada: '蝉',
            cicadaFact: '在大宫公园有很多蝉在叫。',
            beetle: '甲虫',
            beetleFact: '甲虫在浦和很受欢迎。',
            dragonfly: '蜻蜓',
            dragonflyFact: '蜻蜓在见沼田圃飞来飞去。',
            attemptCapture: '尝试捕捉',
            captureInsect: '来捕捉虫子',
            captureSuccess: '捕捉成功！',
            captureFail: '逃走了！',
            subjectSelect: '请选择学习模式',
            subjectMath: '数学迷宫',
            subjectMathDescription: '用数学解谜并击败怪物。',
            subjectKokugo: '国语挑战',
            subjectKokugoDescription: '练习阅读、汉字、词汇与读解能力。',
            startKokugo: '开始国语练习',
            kokugoIntro: '选择年级和难度开始语言挑战。',
            studyLanguageLabel: '练习语言',
            nativeLanguageLabel: '辅助语言',
            swapLanguages: '交换语言',
            difficultyEasy: '简单',
            difficultyNormal: '一般',
            difficultyHard: '困难',
            questionTypeReading: '朗读',
            questionTypeKanji: '汉字',
            questionTypeVocab: '词汇',
            questionTypeComprehension: '读解',
            questionTypeGrammar: '语法',
            questionProgress: '第 {current} / {total} 题',
            hintsRemaining: '提示 {remaining}/{total}',
            ttsPlay: '语音播放',
            ttsStop: '停止播放',
            supportPrompt: '提示 ({lang})',
            kokugoSummaryTitle: '国语挑战结果',
            kokugoSummaryAccuracy: '正确率',
            kokugoSummaryCorrect: '答对题数',
            kokugoSummaryAgain: '再挑战一次',
            kokugoSummaryMenu: '返回菜单',
            kokugoSummaryDetails: '查看答题',
            nextQuestion: '下一题',
            kokugoViewResults: '查看结果',
            kokugoNoQuestions: '所选条件下没有可用的问题。',
            languageStatsTitle: '语言学习统计',
            languageStatsDescription: '按科目与语言的正确情况',
            languageColumn: '语言',
            subjectColumn: '科目',
            answeredColumn: '作答数',
            correctColumn: '答对数',
            accuracyColumn: '正确率',
            comprehensionAccuracy: '读解正确率',
            badgeLangNovice: 'Lang Novice',
            badgeReadingChamp: 'Reading Champ',
            badgeBugCatcher: 'Bug Catcher',
        }
    }), []);



    const i18n = useMemo(() => new I18nManager(translations), [translations]);

    const [language, setLanguage] = useState(() => i18n.restoreLanguage());

    const [learningLanguage, setLearningLanguage] = useState(() => {

        if (typeof window === 'undefined' || !window.localStorage) {

            return 'en';

        }

        const stored = window.localStorage.getItem(STORAGE_KEYS.learningLanguage);

        return stored && translations[stored] ? stored : 'en';

    });

    const t = i18n.getLanguage(language);

    const formatText = (template, values = {}) => {
        if (!template || typeof template !== 'string') {
            return '';
        }
        return template.replace(/\{(\w+)\}/g, (match, key) => Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match);
    };

    const [selectedSubject, setSelectedSubject] = useState('math');
    const [kokugoGrade, setKokugoGrade] = useState(2);
    const [kokugoDifficulty, setKokugoDifficulty] = useState('easy');
    const [kokugoTypes, setKokugoTypes] = useState(() => new Set(KOKUGO_TYPES));
    const [kokugoSession, setKokugoSession] = useState(null);
    const [kokugoHistory, setKokugoHistory] = useState([]);
    const [maxKokugoQuestions] = useState(5);
    const [kokugoAnswer, setKokugoAnswer] = useState('');
    const [kokugoHintVisible, setKokugoHintVisible] = useState(false);
    const [kokugoFeedback, setKokugoFeedback] = useState(null);
    const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);

    const speechRef = useRef(null);

    const buildKokugoQuestion = useCallback(({ grade, difficulty, lang, supportLang, questionTypes, excludeIds = [] }) => {
        const question = questionManager.getRandomQuestion({ grade, subject: 'kokugo', lang, difficulty, questionTypes, excludeIds });
        if (!question) {
            return null;
        }
        const support = supportLang && supportLang !== lang
            ? questionManager.getQuestionForLanguage({ grade, subject: 'kokugo', suffix: question.suffix || '0000', lang: supportLang })
            : null;
        return {
            question,
            support,
            revealedHints: 0,
            attempts: 0
        };
    }, []);




    // Monster types with multilingual names

    const getMonsterTypes = useCallback(() => {

        const monsterNames = {
            ja: {
                denkiryu: { name: 'デンキリュウ', desc: 'でんきタイプ！たし算で こうげきだ！' },
                mizugame: { name: 'ミズガメ', desc: 'みずタイプ！ひき算の わざを はつ！' },
                happamon: { name: 'ハッパモン', desc: 'くさタイプ！かずの ちからを くらべる！' },
                honoodon: { name: 'ホノオドン', desc: 'ほのおタイプ！あつい たし算を だす！' },
                starion: { name: 'スタリオン', desc: 'ほしタイプ！かけ算の ほしを ふらせる！' },
                crystalos: { name: 'クリスタロス', desc: 'クリスタルタイプ！わり算で こうげき！' },
                raidenking: { name: 'ライデンキング', desc: 'でんせつの ボス！たおさないと さきに すすめない！' },
                mathemperor: { name: 'マスエンペラー', desc: 'さんすうの ていおう！九九を マスターしている！' }
            },
            en: {
                denkiryu: { name: 'Electrox', desc: 'Electric type! Attacks with addition!' },
                mizugame: { name: 'Aquaturtle', desc: 'Water type! Uses subtraction skills!' },
                happamon: { name: 'Leafmon', desc: 'Grass type! Compares number powers!' },
                honoodon: { name: 'Blazedon', desc: 'Fire type! Throws hot additions!' },
                starion: { name: 'Starion', desc: 'Star type! Rains multiplication stars!' },
                crystalos: { name: 'Crystalos', desc: 'Crystal type! Attacks with division!' },
                raidenking: { name: 'Thunder King', desc: 'Legendary boss! Must defeat to proceed!' },
                mathemperor: { name: 'Math Emperor', desc: 'Emperor of math! Master of times tables!' }
            },
            fr: {
                denkiryu: { name: 'Électryx', desc: 'Type électrique! Attaque avec addition!' },
                mizugame: { name: 'Aquatortue', desc: 'Type eau! Utilise la soustraction!' },
                happamon: { name: 'Feuilmon', desc: 'Type plante! Compare les nombres!' },
                honoodon: { name: 'Flammedon', desc: 'Type feu! Lance des additions brûlantes!' },
                starion: { name: 'Étoilon', desc: 'Type étoile! Pleut des multiplications!' },
                crystalos: { name: 'Crystalos', desc: 'Type cristal! Attaque avec division!' },
                raidenking: { name: 'Roi Tonnerre', desc: 'Boss légendaire! À vaincre pour continuer!' },
                mathemperor: { name: 'Empereur Math', desc: 'Empereur des maths! Maître des tables!' }
            },
            zh: {
                denkiryu: { name: '电龙', desc: '电系！用加法攻击！' },
                mizugame: { name: '水龟', desc: '水系！使用减法技能！' },
                happamon: { name: '叶兽', desc: '草系！比较数字力量！' },
                honoodon: { name: '火焰兽', desc: '火系！发出炽热的加法！' },
                starion: { name: '星兽', desc: '星系！降下乘法之星！' },
                crystalos: { name: '水晶兽', desc: '水晶系！用除法攻击！' },
                raidenking: { name: '雷王', desc: '传说中的Boss！必须击败才能前进！' },
                mathemperor: { name: '数学皇帝', desc: '数学的帝王！掌握九九表！' }
            }
        };

        return [
            // Grade 2 monsters
            {
                id: 'denkiryu',
                name: monsterNames[language].denkiryu.name,
                emoji: '⚡',
                problemType: 'addition',
                description: monsterNames[language].denkiryu.desc,
                isBoss: false,
                grade: 2,
                health: 3
            },
            {
                id: 'mizugame',
                name: monsterNames[language].mizugame.name,
                emoji: '🐢',
                problemType: 'subtraction',
                description: monsterNames[language].mizugame.desc,
                isBoss: false,
                grade: 2,
                health: 3
            },
            {
                id: 'happamon',
                name: monsterNames[language].happamon.name,
                emoji: '🍃',
                problemType: 'comparison',
                description: monsterNames[language].happamon.desc,
                isBoss: false,
                grade: 2,
                health: 3
            },
            {
                id: 'honoodon',
                name: monsterNames[language].honoodon.name,
                emoji: '🔥',
                problemType: 'addition',
                description: monsterNames[language].honoodon.desc,
                isBoss: false,
                grade: 2,
                health: 3
            },
            // Grade 3 monsters
            {
                id: 'starion',
                name: monsterNames[language].starion.name,
                emoji: '⭐',
                problemType: 'multiplication',
                description: monsterNames[language].starion.desc,
                isBoss: false,
                grade: 3,
                health: 3
            },
            {
                id: 'crystalos',
                name: monsterNames[language].crystalos.name,
                emoji: '💎',
                problemType: 'division',
                description: monsterNames[language].crystalos.desc,
                isBoss: false,
                grade: 3,
                health: 3
            },
            // Boss monsters
            {
                id: 'raidenking',
                name: monsterNames[language].raidenking.name,
                emoji: '👑',
                problemType: 'addition',
                description: monsterNames[language].raidenking.desc,
                isBoss: true,
                grade: 2,
                health: 5
            },
            {
                id: 'mathemperor',
                name: monsterNames[language].mathemperor.name,
                emoji: '🏰',
                problemType: 'multiplication',
                description: monsterNames[language].mathemperor.desc,
                isBoss: true,
                grade: 3,
                health: 7
            }
        ];
    }, [language]);



    const getSpeechLocale = (code) => {
        switch (code) {
            case 'ja':
                return 'ja-JP';
            case 'fr':
                return 'fr-FR';
            case 'zh':
                return 'zh-CN';
            default:
                return 'en-US';
        }
    };

    const speak = useCallback((textValue, voiceLang) => {
        if (typeof window === 'undefined' || !window.speechSynthesis || !textValue) {
            return;
        }
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(textValue);
            utterance.lang = voiceLang || getSpeechLocale(language);
            utterance.onstart = () => setIsTTSSpeaking(true);
            utterance.onend = () => {
                setIsTTSSpeaking(false);
                speechRef.current = null;
            };
            utterance.onerror = () => {
                setIsTTSSpeaking(false);
                speechRef.current = null;
            };
            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        } catch (error) {
            console.warn('Speech synthesis failed', error);
        }
    }, [language]);

    const stopSpeech = useCallback(() => {
        if (typeof window === 'undefined' || !window.speechSynthesis) {
            return;
        }
        window.speechSynthesis.cancel();
        speechRef.current = null;
        setIsTTSSpeaking(false);
    }, []);

    useEffect(() => () => stopSpeech(), [stopSpeech]);

    // Game state
    const [gameState, setGameState] = useState('menu');
    const [currentLevel, setCurrentLevel] = useState(1);
    const [selectedGrade, setSelectedGrade] = useState(2);
    const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
    const [maze, setMaze] = useState([]);
    const [mazeSize, setMazeSize] = useState(5);
    const [monsterPositions, setMonsterPositions] = useState([]);
    const [defeatedMonsters, setDefeatedMonsters] = useState([]);
    const [currentMonster, setCurrentMonster] = useState(null);
    const [battleState, setBattleState] = useState(null);
    const [bossGates, setBossGates] = useState([]);
    const [requiredBosses, setRequiredBosses] = useState([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [message, setMessage] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [activeMode, setActiveMode] = useState('dungeon');
    const [selectedWorld, setSelectedWorld] = useState(null);
    const [activeMiniGame, setActiveMiniGame] = useState(null);
    const [miniGameState, setMiniGameState] = useState(null);
    const [miniGameAnswer, setMiniGameAnswer] = useState('');
    const [miniGameFeedback, setMiniGameFeedback] = useState(null);
    const [coopSession, setCoopSession] = useState(null);
    const [coopAnswer, setCoopAnswer] = useState('');
    const [versusSession, setVersusSession] = useState(null);
    const [versusAnswer, setVersusAnswer] = useState('');
    const [storyScene, setStoryScene] = useState(null);
    const [cheerMessage, setCheerMessage] = useState(null);
    const [aiCoachLog, setAiCoachLog] = useState([]);
    const [parentDashboardTab, setParentDashboardTab] = useState('overview');

    const evaluateBadgeUnlocks = useCallback((stats) => {
        if (!Array.isArray(badgeCatalog) || badgeCatalog.length === 0) {
            return [];
        }
        const unlocked = [];
        badgeCatalog.forEach(badge => {
            if (!badge || stats.badges.includes(badge.id)) {
                return;
            }
            const requirement = badge.requirement || {};
            let qualifies = false;
            switch (requirement.type) {
                case 'streak': {
                    const skillInfo = stats.skillMastery && stats.skillMastery[requirement.skill];
                    if (skillInfo && skillInfo.streak >= (requirement.count || 5) && (skillInfo.accuracy || 0) >= 0.75) {
                        qualifies = true;
                    }
                    break;
                }
                case 'miniGame': {
                    const record = stats.miniGameRecords && stats.miniGameRecords[requirement.miniGame];
                    if (record && (record.wins || 0) >= (requirement.wins || 3)) {
                        qualifies = true;
                    }
                    break;
                }
                case 'storyClear': {
                    const stories = new Set(stats.storyBeatsUnlocked || []);
                    if (stories.size >= (requirement.episodes || 1) || stories.has('finale')) {
                        qualifies = true;
                    }
                    break;
                }
                default:
                    break;
            }
            if (qualifies) {
                unlocked.push(badge.id);
            }
        });
        return unlocked;
    }, [badgeCatalog]);

    const applyBadgeAchievements = useCallback((baseAchievements, newBadges) => {
        if (!newBadges || newBadges.length === 0) {
            return baseAchievements;
        }
        const updated = { ...baseAchievements };
        newBadges.forEach(badgeId => {
            switch (badgeId) {
                case 'carry_master': updated.carryMaster = true; break;
                case 'coin_artist': updated.coinArtist = true; break;
                case 'clock_guardian': updated.clockGuardian = true; break;
                case 'times_table_hero': updated.timesTableHero = true; break;
                case 'unit_wizard': updated.unitWizard = true; break;
                case 'story_scholar': updated.storyScholar = true; break;
                default: break;
            }
        });
        return updated;
    }, []);

const skillLabel = (skill) => {
    switch (skill) {
        case 'addition_carry':
            return t.addition;
        case 'subtraction_borrow':
            return t.subtraction;
        case 'money_counting':
            return t.coinHint ? t.coinHint : t.moneyCounting || t.addition;
        case 'clock_reading':
            return t.clockMatchPrompt || 'Clock';
        case 'even_odd':
            return t.evenOddHint || 'Even or Odd';
        case 'multiplication_array':
            return t.multiplication;
        case 'division_basic':
            return t.division;
        case 'unit_conversion':
            return t.unitConversionPrompt || 'Unit conversion';
        case 'word_problem':
            return t.wordProblemHint || 'Word problem';
        case 'data_reading':
            return t.dataReadingPrompt || 'Data reading';
        default:
            return skill;
    }
};

const skillForMiniGame = (config) => {
    if (!config) return 'addition_carry';
    if (config.skill) return config.skill;
    switch (config.id) {
        case 'clock_match':
            return 'clock_reading';
        case 'coin_count':
            return 'money_counting';
        case 'even_odd_sort':
            return 'even_odd';
        case 'array_painter':
            return 'multiplication_array';
        case 'unit_conversion_lab':
            return 'unit_conversion';
        case 'story_solver':
            return 'word_problem';
        default:
            return 'addition_carry';
    }
};

const createMiniGameProblem = (config, stage = 1) => {
    const skill = skillForMiniGame(config);
    return generateProblem(skill, { grade: selectedGrade, skillKey: skill, stage });
};

const updateMiniGameStats = (gameId, wasCorrect) => {
    setPlayerStats(prev => {
        const records = { ...(prev.miniGameRecords || {}) };
        const current = records[gameId] ? { ...records[gameId] } : { wins: 0, attempts: 0, streak: 0 };
        current.attempts += 1;
        if (wasCorrect) {
            current.wins += 1;
            current.streak = (current.streak || 0) + 1;
        } else {
            current.streak = 0;
        }
        records[gameId] = current;
        return { ...prev, miniGameRecords: records };
    });
};

const startMiniGameSession = (gameId) => {
    const configs = miniGameConfigs || {};
    const config = configs[gameId] || Object.values(configs).find(item => item.id === gameId);
    if (!config) return;
    const initialProblem = createMiniGameProblem(config, 1);
    setActiveMiniGame(config);
    setMiniGameState({ config, problem: initialProblem, stage: 1, successCount: 0, progress: 0 });
    setMiniGameAnswer('');
    setMiniGameFeedback(null);
    setGameState('miniGame');
};

const endMiniGameSession = () => {
    setActiveMiniGame(null);
    setMiniGameState(null);
    setMiniGameAnswer('');
    setMiniGameFeedback(null);
    setGameState('modeSelect');
};

const advanceMiniGame = (wasCorrect) => {
    setMiniGameState(prev => {
        if (!prev) return prev;
        const nextStage = wasCorrect ? Math.min(prev.stage + 1, 5) : Math.max(1, prev.stage - 1);
        const nextProblem = createMiniGameProblem(prev.config, nextStage);
        return {
            ...prev,
            problem: nextProblem,
            stage: nextStage,
            successCount: wasCorrect ? prev.successCount + 1 : prev.successCount,
            progress: prev.progress + 1
        };
    });
};

const submitMiniGameAnswer = (answer) => {
    if (!miniGameState || !miniGameState.problem) return;
    const expected = miniGameState.problem.answer;
    const wasCorrect = String(answer).trim() === String(expected).trim();
    updateMiniGameStats(miniGameState.config.id, wasCorrect);
    recordLanguageResult({
        subject: 'math',
        lang: language,
        isCorrect: wasCorrect,
        questionType: skillForMiniGame(miniGameState.config),
        skillKey: skillForMiniGame(miniGameState.config),
        responseTime: null
    });
    setMiniGameFeedback(wasCorrect ? t.correct : `${t.incorrect} (${expected})`);
    if (wasCorrect) {
        setMiniGameAnswer('');
    }
    advanceMiniGame(wasCorrect);
};

const handleMiniGameChoice = (option) => {
    submitMiniGameAnswer(option);
};

const openStoryBeat = (beat) => {
    if (!beat) return;
    setStoryScene({ beat, unlocked: unlockedStoryIds.has(beat.id) });
    setGameState('story');
};

const completeStoryBeat = (beat) => {
    if (!beat) return;
    setPlayerStats(prev => {
        const unlocked = new Set(prev.storyBeatsUnlocked || []);
        if (!unlocked.has(beat.id)) {
            unlocked.add(beat.id);
        }
        const rewardPoints = beat.id === 'finale' ? 400 : 150;
        const modeHistory = [...(prev.modeHistory || []), { timestamp: Date.now(), event: 'story', id: beat.id }].slice(-120);
        return {
            ...prev,
            storyBeatsUnlocked: Array.from(unlocked),
            points: prev.points + rewardPoints,
            modeHistory
        };
    });
    setStoryScene(null);
    setGameState('modeSelect');
};

const openCoopMission = (scenario) => {
    if (!scenario) return;
    const skill = scenario.coreSkill || 'addition_carry';
    const problem = generateProblem(skill, { grade: selectedGrade, skillKey: skill });
    setCoopSession({ scenario, problem });
    setCoopAnswer('');
    setGameState('coop');
};

const submitCoopAnswer = (answer) => {
    if (!coopSession || !coopSession.problem) return;
    const skill = coopSession.scenario.coreSkill || 'addition_carry';
    const wasCorrect = String(answer).trim() === String(coopSession.problem.answer).trim();
    recordLanguageResult({
        subject: 'math',
        lang: language,
        isCorrect: wasCorrect,
        questionType: skill,
        skillKey: skill,
        responseTime: null
    });
    setPlayerStats(prev => ({
        ...prev,
        cooperativeRecords: [...(prev.cooperativeRecords || []), { timestamp: Date.now(), scenario: coopSession.scenario.id, success: wasCorrect }].slice(-40)
    }));
    setCoopAnswer('');
    setCoopSession(prev => prev ? { ...prev, problem: generateProblem(skill, { grade: selectedGrade, skillKey: skill }) } : prev);
    setCheerMessage({ type: wasCorrect ? 'success' : 'encourage', text: wasCorrect ? t.correct : t.incorrect, timestamp: Date.now() });
};

const openVersusMatch = (scenario) => {
    if (!scenario) return;
    const skill = scenario.coreSkill || 'even_odd';
    const problem = generateProblem(skill, { grade: selectedGrade, skillKey: skill });
    setVersusSession({ scenario, problem });
    setVersusAnswer('');
    setGameState('versus');
};

const submitVersusAnswer = (answer) => {
    if (!versusSession || !versusSession.problem) return;
    const skill = versusSession.scenario.coreSkill || 'even_odd';
    const wasCorrect = String(answer).trim() === String(versusSession.problem.answer).trim();
    recordLanguageResult({
        subject: 'math',
        lang: language,
        isCorrect: wasCorrect,
        questionType: skill,
        skillKey: skill,
        responseTime: null
    });
    setPlayerStats(prev => ({
        ...prev,
        versusRecords: [...(prev.versusRecords || []), { timestamp: Date.now(), scenario: versusSession.scenario.id, success: wasCorrect }].slice(-40)
    }));
    setVersusAnswer('');
    setVersusSession(prev => prev ? { ...prev, problem: generateProblem(skill, { grade: selectedGrade, skillKey: skill }) } : prev);
    setCheerMessage({ type: wasCorrect ? 'success' : 'encourage', text: wasCorrect ? t.correct : t.incorrect, timestamp: Date.now() });
};

const openParentDashboard = () => {
    setActiveMode('parent');
    setGameState('parentDashboard');
    setParentDashboardTab('overview');
};

const beginDungeonAdventure = () => {
    setActiveMode('dungeon');
    setTimeout(() => generateMaze(mazeSize), 50);
    setGameState('maze');
};

const CheerToast = () => {
    if (!cheerMessage) return null;
    const tone = cheerMessage.type === 'success' ? 'bg-emerald-500' : 'bg-sky-500';
    return (
        <div className={`fixed top-6 right-6 z-50 text-white px-4 py-3 rounded-2xl shadow-xl ${tone}`}>
            <div className="flex items-center gap-2">
                <span>{cheerMessage.type === 'success' ? '✨' : '💬'}</span>
                <span>{cheerMessage.text}</span>
            </div>
        </div>
    );
};


    useEffect(() => {
        if (!cheerMessage) return;
        const timer = setTimeout(() => setCheerMessage(null), 3500);
        return () => clearTimeout(timer);
    }, [cheerMessage]);

    useEffect(() => {
        if (gameState !== 'kokugoQuestion') {
            stopSpeech();
        }
    }, [gameState, stopSpeech]);

    // Insect capture state
    const [selectedArea, setSelectedArea] = useState(null);
    const [currentInsect, setCurrentInsect] = useState(null);
    const [captureQuestion, setCaptureQuestion] = useState(null);
    const [captureResult, setCaptureResult] = useState(null);

    const [playerStats, setPlayerStats] = useState(() => {
        if (typeof window === 'undefined' || !window.localStorage) {
            return createDefaultPlayerStats();
        }
        try {
            const cached = window.localStorage.getItem(STORAGE_KEYS.stats);
            return cached ? normalizePlayerStats(JSON.parse(cached)) : createDefaultPlayerStats();
        } catch (error) {
            console.warn('Failed to load stats', error);
            return createDefaultPlayerStats();
        }
    });

    const [capturedInsects, setCapturedInsects] = useState(() => playerStats.capturedInsects || []);

    const areaInsects = {
        urawa: { insect: 'beetle' },
        omiya: { insect: 'cicada' },
        iwatsuki: { insect: 'dragonfly' }
    };

    useEffect(() => {
        setPlayerStats(prev => {
            if (prev.capturedInsects === capturedInsects) {
                return prev;
            }
            const achievements = { ...prev.achievements };
            if (!achievements.bugCatcher && capturedInsects.length >= Object.keys(areaInsects).length) {
                achievements.bugCatcher = true;
            }
            return { ...prev, capturedInsects, achievements };
        });
    }, [capturedInsects]);

    // Language selector component
    const LanguageSelector = () => (
        <div className="flex justify-center gap-2 mb-4">
            {SUPPORTED_LANGUAGES.map(code => (
                <button
                    key={code}
                    onClick={() => setLanguage(code)}
                    className={`px-3 py-1 rounded text-sm font-bold transition-all ${language === code ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : 'bg-gray-300 hover:bg-gray-400'}`}
                >
                    {LANGUAGE_LABELS[code] || code.toUpperCase()}
                </button>
            ))}
        </div>
    );


// Save language preference
    useEffect(() => {
        i18n.persistLanguage(language);
    }, [i18n, language]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEYS.learningLanguage, learningLanguage);
        }
    }, [learningLanguage]);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                window.localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(playerStats));
            } catch (error) {
                console.warn('Failed to save stats', error);
            }
        }
    }, [playerStats]);

    
const recordLanguageResult = ({ subject, lang, isCorrect, questionType, skillKey, responseTime }) => {
    const subjectKey = subject === 'kokugo' ? 'kokugo' : 'math';
    const targetLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : SUPPORTED_LANGUAGES[0];
    const skill = skillKey || questionType || 'general';

    setPlayerStats(prev => {
        const languageStats = { ...prev.languageStats };
        const subjectStats = { ...languageStats[subjectKey] };
        const currentStats = subjectStats[targetLang] ? { ...subjectStats[targetLang] } : {
            answered: 0,
            correct: 0,
            comprehensionAnswered: 0,
            comprehensionCorrect: 0,
            streak: 0
        };

        currentStats.answered += 1;
        if (isCorrect) {
            currentStats.correct += 1;
            currentStats.streak = (currentStats.streak || 0) + 1;
        } else {
            currentStats.streak = 0;
        }
        if (subjectKey === 'kokugo' && questionType === 'comprehension') {
            currentStats.comprehensionAnswered += 1;
            if (isCorrect) {
                currentStats.comprehensionCorrect += 1;
            }
        }
        subjectStats[targetLang] = currentStats;
        languageStats[subjectKey] = subjectStats;

        const skillMastery = { ...prev.skillMastery };
        const masteryEntry = skillMastery[skill] ? { ...skillMastery[skill] } : {
            answered: 0,
            correct: 0,
            streak: 0,
            accuracy: 0,
            level: 1
        };
        masteryEntry.answered += 1;
        if (isCorrect) {
            masteryEntry.correct += 1;
            masteryEntry.streak = (masteryEntry.streak || 0) + 1;
        } else {
            masteryEntry.streak = 0;
        }
        masteryEntry.accuracy = masteryEntry.correct / Math.max(1, masteryEntry.answered);
        if (isCorrect && masteryEntry.streak >= 5 && masteryEntry.accuracy >= 0.8) {
            masteryEntry.level = Math.min((masteryEntry.level || 1) + 1, 5);
        } else if (!isCorrect && masteryEntry.accuracy < 0.5) {
            masteryEntry.level = Math.max((masteryEntry.level || 1) - 1, 1);
        }
        skillMastery[skill] = masteryEntry;

        const pointsGain = isCorrect ? 20 + (masteryEntry.level || 1) * 2 : Math.max(1, Math.floor((masteryEntry.level || 1) / 2));
        const experienceGain = isCorrect ? 15 + (masteryEntry.level || 1) : 5;

        let experience = prev.experience + experienceGain;
        let level = prev.level;
        let nextLevelExp = prev.nextLevelExp;
        const levelUps = [];
        while (experience >= nextLevelExp) {
            experience -= nextLevelExp;
            level += 1;
            levelUps.push(level);
            nextLevelExp = Math.round(nextLevelExp * 1.35);
        }

        const updatedStats = {
            ...prev,
            languageStats,
            skillMastery,
            points: prev.points + pointsGain,
            experience,
            level,
            nextLevelExp,
            totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
        };

        const historyEntry = { timestamp: Date.now(), event: 'question', subject: subjectKey, skill, correct: isCorrect, responseTime };
        const priorHistory = Array.isArray(prev.modeHistory) ? prev.modeHistory : [];
        if (levelUps.length > 0) {
            updatedStats.modeHistory = [...priorHistory, { timestamp: Date.now(), event: 'levelUp', levels: levelUps }].slice(-120);
        } else {
            updatedStats.modeHistory = [...priorHistory, historyEntry].slice(-120);
        }

        const newBadges = evaluateBadgeUnlocks(updatedStats);
        if (newBadges.length > 0) {
            const badgePointBonus = newBadges.reduce((sum, badgeId) => {
                const badge = badgeCatalog.find(entry => entry.id === badgeId);
                return sum + (badge && badge.reward && badge.reward.points ? badge.reward.points : 0);
            }, 0);
            updatedStats.points += badgePointBonus;
            const priorBadges = Array.isArray(prev.badges) ? prev.badges : [];
            updatedStats.badges = [...new Set([...priorBadges, ...newBadges])];
            updatedStats.achievements = applyBadgeAchievements(prev.achievements, newBadges);
            const unlocks = newBadges.flatMap(badgeId => {
                const badge = badgeCatalog.find(entry => entry.id === badgeId);
                return badge && badge.reward && badge.reward.shopUnlock ? [badge.reward.shopUnlock] : [];
            });
            if (unlocks.length > 0) {
                const priorUnlocks = Array.isArray(prev.shopUnlocks) ? prev.shopUnlocks : [];
                updatedStats.shopUnlocks = [...new Set([...priorUnlocks, ...unlocks])];
            }
        }

        const now = new Date();
        const weekKey = `${now.getFullYear()}-W${Math.ceil((now.getDate() + now.getDay()) / 7)}`;
        const existingWeeks = Array.isArray(prev.weeklyProgress) ? prev.weeklyProgress : [];
        const weeklyMap = new Map(existingWeeks.map(entry => [entry.week, { ...entry }]));
        const currentWeek = weeklyMap.get(weekKey) || { week: weekKey, answered: 0, correct: 0, points: 0 };
        currentWeek.answered += 1;
        if (isCorrect) currentWeek.correct += 1;
        currentWeek.points += pointsGain;
        weeklyMap.set(weekKey, currentWeek);
        updatedStats.weeklyProgress = Array.from(weeklyMap.values()).slice(-12);

        if (subjectKey === 'kokugo') {
            const achievements = { ...updatedStats.achievements };
            const compAnswered = currentStats.comprehensionAnswered;
            const compCorrect = currentStats.comprehensionCorrect;
            if (!achievements.langNovice && currentStats.correct >= 5) achievements.langNovice = true;
            if (!achievements.readingChamp && compCorrect >= 3 && compAnswered > 0 && Math.round((compCorrect / Math.max(1, compAnswered)) * 100) >= 70) {
                achievements.readingChamp = true;
            }
            updatedStats.achievements = achievements;
        }

        return updatedStats;
    });

    const tutorProfile = aiTutorProfiles[playerStats.tutorProfile] || aiTutorProfiles.adaptiveCoach || {};
    const encouragementPool = isCorrect
        ? (tutorProfile.cheers && tutorProfile.cheers.correct) || (tutorProfile.behaviors && tutorProfile.behaviors.encouragement)
        : (tutorProfile.cheers && tutorProfile.cheers.incorrect) || (tutorProfile.behaviors && tutorProfile.behaviors.encouragement);
    if (encouragementPool && encouragementPool.length > 0) {
        const message = encouragementPool[Math.floor(Math.random() * encouragementPool.length)];
        setCheerMessage({ type: isCorrect ? 'success' : 'encourage', text: message, timestamp: Date.now() });
    }

    setAiCoachLog(prev => {
        const history = Array.isArray(prev) ? prev : [];
        return [...history.slice(-9), { timestamp: Date.now(), skill: skillKey || questionType, isCorrect, responseTime }];
    });
};

// Generate maze
    // Generate maze
    const generateMaze = useCallback((size) => {
        const newMaze = Array(size).fill().map(() => Array(size).fill(0));

        // Add walls (random but avoid start/goal)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (Math.random() < 0.2 && !(x === 0 && y === 0) && !(x === size - 1 && y === size - 1)) {
                    newMaze[y][x] = 1;
                }
            }
        }

        // Ensure start and goal
        newMaze[0][0] = 0;
        newMaze[size - 1][size - 1] = 2;

        // Carve a simple path
        for (let i = 0; i < size - 1; i++) {
            if (Math.random() < 0.5) {
                newMaze[i][i] = 0;
                newMaze[i][i + 1] = 0;
            } else {
                newMaze[i][i] = 0;
                newMaze[i + 1][i] = 0;
            }
        }

        const gates = [];
        const bosses = [];
        if (currentLevel > 3 && size >= 7) {
            const gateY = size - 2;
            const gateX = size - 1;
            if (newMaze[gateY][gateX] === 0) {
                newMaze[gateY][gateX] = 3; // gate
                gates.push({ x: gateX, y: gateY, id: 'gate-1' });
            }
        }

        // Place monsters by grade
        const monsterTypes = getMonsterTypes();
        const gradeMonsters = monsterTypes.filter(m => m.grade === selectedGrade);
        const normalMonsters = gradeMonsters.filter(m => !m.isBoss);
        const bossMonsters = gradeMonsters.filter(m => m.isBoss);

        const monsters = [];

        // Boss placement (if gate present)
        if (gates.length > 0 && bossMonsters.length > 0) {
            let bossPlaced = false;
            for (let attempts = 0; attempts < 50 && !bossPlaced; attempts++) {
                const x = Math.floor(Math.random() * (size - 2)) + 1;
                const y = Math.floor(Math.random() * (size - 2)) + 1;
                if (newMaze[y][x] === 0 && !(x === 0 && y === 0) && !(x === size - 1 && y === size - 1)) {
                    const bossType = bossMonsters[Math.floor(Math.random() * bossMonsters.length)];
                    monsters.push({ x, y, type: bossType, id: `boss-${gates[0].id}`, isBoss: true });
                    bosses.push(`boss-${gates[0].id}`);
                    bossPlaced = true;
                }
            }
        }

        // Normal monsters
        const monsterCount = Math.min(Math.floor(size / 2), 4);
        for (let i = 0; i < monsterCount; i++) {
            let placed = false;
            let attempts = 0;
            while (!placed && attempts < 50) {
                const x = Math.floor(Math.random() * size);
                const y = Math.floor(Math.random() * size);
                if (newMaze[y][x] === 0 && !(x === 0 && y === 0) && !(x === size - 1 && y === size - 1) &&
                    !monsters.some(m => m.x === x && m.y === y)) {
                    const monsterType = normalMonsters[Math.floor(Math.random() * normalMonsters.length)];
                    monsters.push({ x, y, type: monsterType, id: `monster-${i}`, isBoss: false });
                    placed = true;
                }
                attempts++;
            }
        }

        setMaze(newMaze);
        setMonsterPositions(monsters);
        setBossGates(gates);
        setRequiredBosses(bosses);
        setPlayerPosition({ x: 0, y: 0 });
        setDefeatedMonsters([]);
    }, [currentLevel, selectedGrade, getMonsterTypes]);

    // Problem generator
    
const generateProblem = useCallback((type, overrides = {}) => {
    const grade = overrides.grade || selectedGrade;
    const skillKey = overrides.skillKey || overrides.skill || type;
    const mastery = playerStats.skillMastery && playerStats.skillMastery[skillKey];
    const stage = overrides.stage || (mastery && mastery.level ? mastery.level : 1);
    const clampStage = Math.max(1, Math.min(stage, 5));

    const randBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffle = (arr) => arr.map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(item => item.value);
    const numericOptions = (correct, spread, minVal) => {
        const options = new Set();
        options.add(correct);
        while (options.size < 4) {
            const delta = randBetween(1, spread);
            const candidate = Math.max(minVal, correct + (Math.random() > 0.5 ? delta : -delta));
            options.add(candidate);
        }
        return shuffle(Array.from(options));
    };
    const formatTimeLabel = (hour, minute) => `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const parityLabels = [t.evenLabel || 'Even', t.oddLabel || 'Odd', t.parityBoth || 'Both', t.parityNeither || 'Neither'];

    let problem = { question: '0 + 0 = ?', answer: 0, options: [0, 1, 2, 3], hint: '', skill: skillKey };

    switch (type) {
        case 'addition':
        case 'addition_carry': {
            const maxValue = grade === 2 ? (clampStage >= 3 ? 99 : 60) : 150;
            let a = randBetween(10, maxValue);
            let b = randBetween(10, maxValue);
            if (type === 'addition_carry') {
                while ((a % 10) + (b % 10) < 10) {
                    a = randBetween(10, maxValue);
                    b = randBetween(10, maxValue);
                }
            }
            const answer = a + b;
            problem = {
                question: `${a} + ${b} = ?`,
                answer,
                options: numericOptions(answer, 15, 0),
                hint: type === 'addition_carry' ? (t.additionCarryHint || t.whichBigger) : `${a} + ${b} = ?`,
                skill: skillKey
            };
            break;
        }
        case 'subtraction':
        case 'subtraction_borrow': {
            const maxValue = grade === 2 ? (clampStage >= 3 ? 120 : 80) : 150;
            let minuend = randBetween(30, maxValue);
            let subtrahend = randBetween(5, minuend - 5);
            if (type === 'subtraction_borrow') {
                while ((minuend % 10) >= (subtrahend % 10)) {
                    minuend = randBetween(30, maxValue);
                    subtrahend = randBetween(5, minuend - 5);
                }
            }
            const answer = minuend - subtrahend;
            problem = {
                question: `${minuend} - ${subtrahend} = ?`,
                answer,
                options: numericOptions(answer, 12, 0),
                hint: type === 'subtraction_borrow' ? (t.subtractionBorrowHint || `${minuend} - ${subtrahend}`) : `${minuend} - ${subtrahend} = ?`,
                skill: skillKey
            };
            break;
        }
        case 'comparison': {
            let num1 = randBetween(10, clampStage >= 3 ? 150 : 90);
            let num2 = randBetween(10, clampStage >= 3 ? 150 : 90);
            while (num1 === num2) num2 = randBetween(10, clampStage >= 3 ? 150 : 90);
            const bigger = num1 > num2 ? num1 : num2;
            problem = {
                question: `${t.whichBigger} ${num1} vs ${num2}`,
                answer: bigger,
                options: shuffle([num1, num2, bigger + randBetween(1, 5), Math.max(0, bigger - randBetween(1, 5))]),
                hint: t.comparisonHint || t.whichBigger,
                skill: skillKey
            };
            break;
        }
        case 'clock_reading': {
            const step = clampStage >= 3 ? 5 : clampStage === 2 ? 10 : 15;
            const hour = randBetween(1, 12);
            const minute = randBetween(0, Math.floor(60 / step) - 1) * step;
            const answer = formatTimeLabel(hour, minute);
            const distractors = [
                formatTimeLabel(((hour + randBetween(1, 5) - 1) % 12) + 1, minute),
                formatTimeLabel(hour === 12 ? 1 : hour + 1, minute),
                formatTimeLabel(hour, (minute + step) % 60)
            ];
            problem = {
                question: `${(t.clockMatchPrompt || 'Clock Challenge')}: ${answer}`,
                answer,
                options: shuffle([answer, distractors[0], distractors[1], distractors[2]]),
                hint: t.clockHint || 'Look at the hour and minute hands.',
                skill: skillKey,
                meta: { hour, minute }
            };
            break;
        }
        case 'money_counting': {
            const coinSet = grade === 2 ? [1, 5, 10, 50, 100] : [1, 5, 10, 50, 100, 500];
            const itemCount = randBetween(3, 3 + clampStage);
            const coins = [];
            for (let i = 0; i < itemCount; i += 1) {
                coins.push(coinSet[randBetween(0, coinSet.length - 1)]);
            }
            const answer = coins.reduce((sum, value) => sum + value, 0);
            problem = {
                question: (t.coinGamePrompt || '{expression} = ?').replace('{expression}', coins.map(value => `${t.currencySymbol || '¥'}${value}`).join(' + ')),
                answer,
                options: numericOptions(answer, 30, 0),
                hint: t.coinHint || 'Add each coin value.',
                skill: skillKey,
                meta: { coins }
            };
            break;
        }
        case 'even_odd': {
            const number = randBetween(10, 120 + clampStage * 10);
            const parityText = number % 2 === 0 ? parityLabels[0] : parityLabels[1];
            const translations = {
                ja: `${number}は偶数？奇数？`,
                en: `${number} is even or odd?`,
                fr: `${number} est pair ou impair ?`,
                zh: `${number} 是偶数还是奇数？`
            };
            const prompt = translations[language] || translations.en;
            problem = {
                question: prompt,
                answer: parityText,
                options: parityLabels,
                hint: t.evenOddHint || 'Check the ones digit.',
                skill: skillKey,
                meta: { number }
            };
            break;
        }
        case 'multiplication':
        case 'multiplication_array': {
            const a = randBetween(2, clampStage >= 3 ? 12 : 9);
            const b = randBetween(2, clampStage >= 3 ? 12 : 9);
            const answer = a * b;
            problem = {
                question: `${a} × ${b} = ?`,
                answer,
                options: numericOptions(answer, 20, 1),
                hint: t.arrayHint || 'Use rows and columns.',
                skill: skillKey,
                meta: { rows: a, cols: b }
            };
            break;
        }
        case 'division':
        case 'division_basic': {
            const divisor = randBetween(2, clampStage >= 3 ? 12 : 9);
            const quotient = randBetween(2, clampStage >= 3 ? 12 : 9);
            const dividend = divisor * quotient;
            problem = {
                question: `${dividend} ÷ ${divisor} = ?`,
                answer: quotient,
                options: numericOptions(quotient, 8, 1),
                hint: t.divisionHint || 'Division undoes multiplication.',
                skill: skillKey
            };
            break;
        }
        case 'word_problem': {
            const children = randBetween(2, 4 + clampStage);
            const perChild = randBetween(2 + clampStage, 5 + clampStage);
            const total = children * perChild;
            const prompts = {
                ja: `${total}個のおかしを${children}人で同じ数ずつ分けます。1人あたりはいくつ？`,
                en: `Share ${total} snacks equally among ${children} kids. How many per kid?`,
                fr: `On partage ${total} friandises entre ${children} enfants. Combien chacun ?`,
                zh: `${total}个点心平均分给${children}个孩子。每人得到多少？`
            };
            const prompt = prompts[language] || prompts.en;
            problem = {
                question: prompt,
                answer: perChild,
                options: numericOptions(perChild, 8, 1),
                hint: t.wordProblemHint || 'Build the equation from the story.',
                skill: skillKey,
                meta: { total, children }
            };
            break;
        }
        case 'unit_conversion': {
            const conversions = [
                { from: 'm', to: 'cm', factor: 100, base: randBetween(2, 6 + clampStage) },
                { from: 'kg', to: 'g', factor: 1000, base: randBetween(1, 4 + clampStage) },
                { from: 'L', to: 'mL', factor: 1000, base: randBetween(1, 3 + clampStage) },
                { from: 'min', to: 's', factor: 60, base: randBetween(2, 6 + clampStage) }
            ];
            const choice = conversions[randBetween(0, conversions.length - 1)];
            const answer = choice.base * choice.factor;
            problem = {
                question: `${t.unitConversionPrompt || 'Convert the unit:'} ${choice.base} ${choice.from} → ? ${choice.to}`,
                answer,
                options: numericOptions(answer, choice.factor, choice.factor),
                hint: t.unitConversionHint || 'Multiply by the conversion factor.',
                skill: skillKey,
                meta: choice
            };
            break;
        }
        case 'data_reading': {
            const dataset = [
                { label: t.dataLabelA || 'A', value: randBetween(10, 25) },
                { label: t.dataLabelB || 'B', value: randBetween(10, 25) },
                { label: t.dataLabelC || 'C', value: randBetween(10, 25) }
            ];
            const shuffled = shuffle(dataset);
            const best = shuffled.reduce((previous, current) => (current.value > previous.value ? current : previous), shuffled[0]);
            problem = {
                question: `${t.dataReadingPrompt || 'Which is the greatest value?'} ${shuffled.map(item => `${item.label}:${item.value}`).join(' / ')}`,
                answer: best.label,
                options: shuffle(shuffled.map(item => item.label)),
                hint: t.dataReadingHint || 'Compare the numbers carefully.',
                skill: skillKey,
                meta: { dataset: shuffled }
            };
            break;
        }
        default:
            break;
    }

    return problem;
}, [selectedGrade, playerStats.skillMastery, t, language]);
    // Options helper
    const generateOptions = (correctAnswer, min, max) => {
        const options = [correctAnswer];
        while (options.length < 4) {
            const option = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!options.includes(option)) options.push(option);
        }
        return options.sort(() => Math.random() - 0.5);
    };

    // Move player
    const movePlayer = useCallback((direction) => {
        if (gameState !== 'maze') return;

        const newPos = { ...playerPosition };
        if (direction === 'up' && newPos.y > 0) newPos.y--;
        if (direction === 'down' && newPos.y < mazeSize - 1) newPos.y++;
        if (direction === 'left' && newPos.x > 0) newPos.x--;
        if (direction === 'right' && newPos.x < mazeSize - 1) newPos.x++;

        // Wall
        if (maze[newPos.y] && maze[newPos.y][newPos.x] === 1) {
            setMessage(t.wall);
            setTimeout(() => setMessage(''), 2000);
            return;
        }

        // Gate
        if (maze[newPos.y] && maze[newPos.y][newPos.x] === 3) {
            const gate = bossGates.find(g => g.x === newPos.x && g.y === newPos.y);
            if (gate) {
                const requiredBossDefeated = requiredBosses.every(bossId => defeatedMonsters.includes(bossId));
                if (!requiredBossDefeated) {
                    setMessage('⚠️ ' + t.gateBlocked);
                    setTimeout(() => setMessage(''), 3000);
                    return;
                } else {
                    const newMaze = maze.map(row => row.slice());
                    newMaze[newPos.y][newPos.x] = 0;
                    setMaze(newMaze);
                    setMessage('✨ ' + t.gateOpened);
                    setTimeout(() => setMessage(''), 2000);
                }
            }
        }

        setPlayerPosition(newPos);

        // Goal
        if (newPos.x === mazeSize - 1 && newPos.y === mazeSize - 1) {
            handleLevelClear();
            return;
        }

        // Monster encounter
        const monster = monsterPositions.find(m => m.x === newPos.x && m.y === newPos.y && !defeatedMonsters.includes(m.id));
        if (monster) startBattle(monster);
    }, [gameState, playerPosition, maze, mazeSize, bossGates, requiredBosses, defeatedMonsters, monsterPositions, t]);

    // Start battle
    const startBattle = (monster) => {
        setMessage('');
        setCurrentMonster(monster);
        const monsterHealth = monster.type.health || (monster.isBoss ? 5 : 3);
        setBattleState({
            monsterHealth,
            maxHealth: monsterHealth,
            currentProblem: generateProblem(monster.type.problemType, { grade: selectedGrade, skillKey: monster.type.problemType, stage: 1 }),
            stage: 1
        });
        setShowHint(false);
        setTimeLeft(monster.isBoss ? 45 : 30);
        setGameState('battle');
    };

    // Handle level clear
    const handleLevelClear = () => {
        setGameState('victory');
        setMessage(`${t.congratulations} ${t.level} ${currentLevel} ${t.clearMessage}`);

        const newBadges = [];
        if (currentLevel === 1 && !playerStats.badges.includes('first_clear')) newBadges.push('first_clear');
        if (defeatedMonsters.length === monsterPositions.length && !playerStats.badges.includes('perfect_clear')) newBadges.push('perfect_clear');
        if (selectedGrade === 3 && !playerStats.badges.includes('multiplication_master')) newBadges.push('multiplication_master');

        if (newBadges.length > 0) {
            setPlayerStats(prev => ({ ...prev, badges: [...prev.badges, ...newBadges] }));
        }
    };

    // Check answer in battle
    
const checkAnswer = (answer) => {
    if (!battleState || !battleState.currentProblem) return;
    setShowHint(false);

    const skill = battleState.currentProblem.skill || (currentMonster ? currentMonster.type.problemType : 'math');
    const baseTime = currentMonster && currentMonster.isBoss ? 45 : 30;
    const responseTime = baseTime - timeLeft;
    const isCorrect = answer === battleState.currentProblem.answer;

    recordLanguageResult({
        subject: 'math',
        lang: language,
        isCorrect,
        questionType: currentMonster ? currentMonster.type.problemType : null,
        skillKey: skill,
        responseTime
    });

    if (isCorrect) {
        setMessage(t.correct);
        const newHealth = battleState.monsterHealth - 1;
        setPlayerStats(prev => ({ ...prev, totalQuestionsAnswered: prev.totalQuestionsAnswered + 1, correctAnswers: prev.correctAnswers + 1 }));
        if (newHealth <= 0) {
            setDefeatedMonsters(prev => [...prev, currentMonster.id]);
            setPlayerStats(prev => {
                const unlocked = prev.unlockedMonsters.includes(currentMonster.type.id)
                    ? prev.unlockedMonsters
                    : [...prev.unlockedMonsters, currentMonster.type.id];
                const battleBonus = currentMonster.isBoss ? 120 : 60;
                return {
                    ...prev,
                    totalMonstersDefeated: prev.totalMonstersDefeated + 1,
                    unlockedMonsters: unlocked,
                    points: prev.points + battleBonus
                };
            });

            if (currentMonster.isBoss) {
                setMessage(`✨ ${t.boss} ${currentMonster.type.name}${t.monsterDefeated}${t.bossDefeated}`);
            } else {
                setMessage(`${currentMonster.type.name}${t.monsterDefeated}`);
            }

            setTimeout(() => {
                setGameState('maze');
                setMessage('');
            }, 2400);
        } else {
            const nextStage = Math.min((battleState.stage || 1) + 1, 5);
            setBattleState({
                monsterHealth: newHealth,
                maxHealth: battleState.maxHealth,
                currentProblem: generateProblem(currentMonster.type.problemType, { grade: selectedGrade, skillKey: skill, stage: nextStage }),
                stage: nextStage
            });
            setTimeLeft(baseTime);
            setTimeout(() => setMessage(''), 1200);
        }
    } else {
        setMessage(t.incorrect);
        setPlayerStats(prev => ({ ...prev, totalQuestionsAnswered: prev.totalQuestionsAnswered + 1 }));
        setTimeout(() => {
            setMessage('');
            setBattleState(prev => {
                if (!prev) return prev;
                const previousStage = prev.stage || 1;
                const nextStage = Math.max(1, previousStage - 1);
                const fallbackSkill = currentMonster ? currentMonster.type.problemType : 'math';
                const nextSkill = prev.currentProblem && prev.currentProblem.skill ? prev.currentProblem.skill : fallbackSkill;
                return {
                    ...prev,
                    currentProblem: generateProblem(currentMonster.type.problemType, { grade: selectedGrade, skillKey: nextSkill, stage: nextStage }),
                    stage: nextStage
                };
            });
            setTimeLeft(baseTime);
        }, 1200);
    }
};

// Timer for battle
    // Timer for battle
    useEffect(() => {
        if (gameState === 'battle' && timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (gameState === 'battle' && timeLeft === 0) {
            setMessage(t.timeUp);
            setTimeout(() => {
                if (currentMonster && battleState) {
                    setBattleState(prev => {
                    if (!prev) return prev;
                    const previousStage = prev.stage || 1;
                    const nextStage = Math.max(1, previousStage - 1);
                    const fallbackSkill = currentMonster ? currentMonster.type.problemType : 'math';
                    const nextSkill = prev.currentProblem && prev.currentProblem.skill ? prev.currentProblem.skill : fallbackSkill;
                    return {
                        ...prev,
                        currentProblem: generateProblem(currentMonster.type.problemType, { grade: selectedGrade, skillKey: nextSkill, stage: nextStage }),
                        stage: nextStage
                    };
                });
                    setTimeLeft(currentMonster.isBoss ? 45 : 30);
                    setShowHint(false);
                }
                setMessage('');
            }, 2000);
        }
    }, [timeLeft, gameState, currentMonster, battleState, generateProblem, t.timeUp]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (gameState !== 'maze') return;
            if (e.key === 'ArrowUp') movePlayer('up');
            if (e.key === 'ArrowDown') movePlayer('down');
            if (e.key === 'ArrowLeft') movePlayer('left');
            if (e.key === 'ArrowRight') movePlayer('right');
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [movePlayer, gameState]);

    // Start game
    const startGameWithGrade = (grade) => {
        setSelectedSubject('math');
        setSelectedGrade(grade);
        setCurrentLevel(1);
        setMazeSize(5);
        setTimeout(() => generateMaze(5), 100);
        setGameState('maze');
    };

    const nextLevel = () => {
        const newLevel = currentLevel + 1;
        const newSize = Math.min(5 + Math.floor(newLevel / 2), 9);
        setCurrentLevel(newLevel);
        setMazeSize(newSize);
        setTimeout(() => generateMaze(newSize), 100);
        setGameState('maze');
    };

    // Insect capture handlers
    const startCapture = (insectKey) => {
        setCurrentInsect(insectKey);
        setCaptureQuestion(generateProblem('addition'));
        setCaptureResult(null);
        setGameState('insectQuiz');
    };

    const checkCaptureAnswer = (answer) => {
        if (!captureQuestion) return;
        if (answer === captureQuestion.answer) {
            setCaptureResult('success');
            if (currentInsect && !capturedInsects.includes(currentInsect)) {
                setCapturedInsects(prev => [...prev, currentInsect]);
            }
        } else {
            setCaptureResult('fail');
        }
    };

    const toggleKokugoType = (type) => {
        setKokugoTypes(prev => {
            const next = new Set(prev);
            if (next.has(type)) {
                if (next.size > 1) {
                    next.delete(type);
                }
            } else {
                next.add(type);
            }
            return next;
        });
    };

    const swapLanguages = () => {
        const currentLearning = learningLanguage;
        const currentUi = language;
        setLearningLanguage(currentUi);
        setLanguage(currentLearning);
    };

    const startKokugoSession = () => {
        const selectedTypes = Array.from(kokugoTypes);
        const availableQuestions = questionManager
            .loadQuestions({ grade: kokugoGrade, subject: 'kokugo', lang: learningLanguage })
            .filter(item => (!kokugoDifficulty || item.difficulty === kokugoDifficulty) && selectedTypes.includes(item.type));
        if (availableQuestions.length === 0) {
            setKokugoFeedback({ type: 'error', message: t.kokugoNoQuestions || t.notFound });
            return;
        }

        const total = Math.min(maxKokugoQuestions, availableQuestions.length);
        const first = buildKokugoQuestion({
            grade: kokugoGrade,
            difficulty: kokugoDifficulty,
            lang: learningLanguage,
            supportLang: language,
            questionTypes: selectedTypes,
            excludeIds: []
        });
        if (!first) {
            setKokugoFeedback({ type: 'error', message: t.kokugoNoQuestions || t.notFound });
            return;
        }

        stopSpeech();
        setSelectedSubject('kokugo');
        setKokugoHistory([]);
        setKokugoAnswer('');
        setKokugoHintVisible(false);
        setKokugoFeedback(null);
        setKokugoSession({
            grade: kokugoGrade,
            difficulty: kokugoDifficulty,
            questionTypes: selectedTypes,
            lang: learningLanguage,
            supportLang: language,
            index: 0,
            total,
            current: first,
            usedIds: [first.question.id]
        });
        setGameState('kokugoQuestion');
    };

    const handleKokugoAnswer = (choice) => {
        if (!kokugoSession || !kokugoSession.current || kokugoAnswer !== '') {
            return;
        }
        const { question, support, revealedHints } = kokugoSession.current;
        const selectedValue = typeof choice === 'string' ? choice : String(choice);
        const answerValue = typeof question.answer === 'string' ? question.answer : String(question.answer);
        const isCorrect = selectedValue === answerValue;
        setKokugoAnswer(selectedValue);
        setKokugoFeedback({ type: isCorrect ? 'success' : 'error', message: isCorrect ? t.correct : t.incorrect });
        setKokugoSession(prev => (prev ? { ...prev, current: { ...prev.current, attempts: prev.current.attempts + 1, isCorrect } } : prev));
        setKokugoHistory(prev => ([...prev, {
            id: question.id,
            prompt: question.prompt,
            answer: question.answer,
            selected: selectedValue,
            isCorrect,
            explanation: question.explanation,
            support,
            hintsUsed: revealedHints || 0,
            type: question.type
        }]));
        setPlayerStats(prev => ({
            ...prev,
            totalQuestionsAnswered: prev.totalQuestionsAnswered + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
        }));
        recordLanguageResult({ subject: 'kokugo', lang: kokugoSession.lang, isCorrect, questionType: question.type, skillKey: question.type, responseTime: null });
        stopSpeech();
    };

    const goToNextKokugoQuestion = () => {
        if (!kokugoSession) {
            setGameState('kokugoSummary');
            return;
        }

        const nextIndex = kokugoSession.index + 1;
        const excludeIds = Array.isArray(kokugoSession.usedIds) ? [...kokugoSession.usedIds] : [];
        let nextStep = null;
        let shouldEnd = nextIndex >= kokugoSession.total;

        if (!shouldEnd) {
            nextStep = buildKokugoQuestion({
                grade: kokugoSession.grade,
                difficulty: kokugoSession.difficulty,
                lang: kokugoSession.lang,
                supportLang: kokugoSession.supportLang,
                questionTypes: kokugoSession.questionTypes,
                excludeIds
            });
            if (!nextStep) {
                shouldEnd = true;
            }
        }

        setKokugoSession(prev => {
            if (!prev) {
                return prev;
            }
            if (shouldEnd) {
                return { ...prev, index: nextIndex, current: null };
            }
            return {
                ...prev,
                index: nextIndex,
                current: nextStep,
                usedIds: [...excludeIds, nextStep.question.id]
            };
        });

        setKokugoAnswer('');
        setKokugoHintVisible(false);
        setKokugoFeedback(null);
        stopSpeech();

        if (shouldEnd) {
            setGameState('kokugoSummary');
        }
    };

    const showNextKokugoHint = () => {
        if (!kokugoSession || !kokugoSession.current) {
            return;
        }
        setKokugoSession(prev => {
            if (!prev || !prev.current) {
                return prev;
            }
            const hintsList = prev.current.question.hints || [];
            const revealed = prev.current.revealedHints || 0;
            if (revealed >= hintsList.length) {
                return prev;
            }
            return {
                ...prev,
                current: {
                    ...prev.current,
                    revealedHints: revealed + 1
                }
            };
        });
        setKokugoHintVisible(true);
    };

    const hideKokugoHints = () => {
        setKokugoHintVisible(false);
    };


    // UI rendering by gameState
    if (gameState === 'menu') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
                    <LanguageSelector />
                    <h1 className="text-5xl font-bold text-center mb-6 text-purple-600">🎮 {t.gameTitle} 🎮</h1>
                    <div className="text-center mb-8">
                        <p className="text-2xl mb-4 text-purple-700">{t.becomeHero}</p>
                        <p className="text-2xl text-pink-700">{t.conquerDungeon}</p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <button onClick={() => { setSelectedSubject('math'); setGameState('subjectSelect'); }} className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-2xl font-bold py-4 rounded-2xl hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all">
                            ⚔️ {t.startGame} ⚔️
                        </button>
                        <button onClick={() => setGameState('map')} className="bg-gradient-to-r from-lime-500 to-green-500 text-white text-xl font-bold py-3 rounded-2xl hover:from-lime-600 hover:to-green-600">
                            🗺️ {t.insectMission}
                        </button>
                        <button onClick={() => setGameState('stats')} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xl font-bold py-3 rounded-2xl hover:from-purple-600 hover:to-pink-600">
                            🏆 {t.stats}
                        </button>
                        <button onClick={() => setGameState('dictionary')} className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xl font-bold py-3 rounded-2xl hover:from-orange-600 hover:to-red-600">
                            📖 {t.dictionary}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'subjectSelect') {

        return (

            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">

                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">

                    <LanguageSelector />

                    <h2 className="text-4xl font-bold text-center mb-6 text-purple-600">🧭 {t.subjectSelect} 🧭</h2>

                    <div className="grid md:grid-cols-2 gap-6">

                        <button onClick={() => { setSelectedSubject('math'); setGameState('gradeSelect'); }} className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all">

                            <div className="text-5xl mb-4">🧮</div>

                            <h3 className="text-2xl font-bold mb-2">{t.subjectMath}</h3>

                            <p className="text-sm opacity-90">{t.subjectMathDescription}</p>

                        </button>

                        <button onClick={() => { setSelectedSubject('kokugo'); setGameState('kokugoSetup'); }} className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl p-6 text-white hover:from-rose-600 hover:to-orange-600 transform hover:scale-105 transition-all">

                            <div className="text-5xl mb-4">🈶</div>

                            <h3 className="text-2xl font-bold mb-2">{t.subjectKokugo}</h3>

                            <p className="text-sm opacity-90">{t.subjectKokugoDescription}</p>

                        </button>

                    </div>

                    <div className="mt-6 text-center">

                        <button onClick={() => setGameState('menu')} className="bg-gray-500 text-white px-8 py-2 rounded-xl hover:bg-gray-600">{t.back}</button>

                    </div>

                </div>

            </div>

        );

    }



    if (gameState === 'kokugoSetup') {

        const difficultyLabels = {

            easy: t.difficultyEasy,

            normal: t.difficultyNormal,

            hard: t.difficultyHard

        };

        const typeLabels = {

            reading: t.questionTypeReading,

            kanji: t.questionTypeKanji,

            vocab: t.questionTypeVocab,

            comprehension: t.questionTypeComprehension,

            grammar: t.questionTypeGrammar

        };



        return (

            <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">

                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full space-y-6">

                    <LanguageSelector />

                    <h2 className="text-4xl font-bold text-center text-rose-600">🈴 {t.startKokugo} 🈴</h2>

                    <p className="text-center text-gray-600">{t.kokugoIntro}</p>



                    <div>

                        <h3 className="text-lg font-semibold text-gray-700 mb-2">{t.selectGrade}</h3>

                        <div className="flex gap-3 flex-wrap">

                            {[2, 3].map(grade => (

                                <button

                                    key={grade}

                                    onClick={() => setKokugoGrade(grade)}

                                    className={`px-4 py-2 rounded-full text-lg font-semibold ${kokugoGrade === grade ? 'bg-rose-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}

                                >{grade} {t.level}</button>

                            ))}

                        </div>

                    </div>



                    <div>

                        <h3 className="text-lg font-semibold text-gray-700 mb-2">{t.level}</h3>

                        <div className="flex gap-3 flex-wrap">

                            {DIFFICULTY_ORDER.map(level => (

                                <button

                                    key={level}

                                    onClick={() => setKokugoDifficulty(level)}

                                    className={`px-4 py-2 rounded-full text-lg font-semibold ${kokugoDifficulty === level ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}

                                >{difficultyLabels[level]}</button>

                            ))}

                        </div>

                    </div>



                    <div>

                        <h3 className="text-lg font-semibold text-gray-700 mb-2">{t.studyContent}</h3>

                        <div className="flex gap-2 flex-wrap">

                            {KOKUGO_TYPES.map(type => (

                                <button

                                    key={type}

                                    onClick={() => toggleKokugoType(type)}

                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${kokugoTypes.has(type) ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}

                                >{typeLabels[type]}</button>

                            ))}

                        </div>

                    </div>



                    <div className="grid md:grid-cols-2 gap-4">

                        <div className="flex flex-col gap-2">

                            <label className="text-sm font-semibold text-gray-700">{t.studyLanguageLabel}</label>

                            <select value={learningLanguage} onChange={e => setLearningLanguage(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500">

                                {SUPPORTED_LANGUAGES.map(code => (

                                    <option key={code} value={code}>{LANGUAGE_LABELS[code] || code.toUpperCase()}</option>

                                ))}

                            </select>

                        </div>

                        <div className="flex flex-col gap-2">

                            <label className="text-sm font-semibold text-gray-700">{t.nativeLanguageLabel}</label>

                            <div className="flex gap-2">

                                <select value={language} onChange={e => setLanguage(e.target.value)} className="border border-gray-300 rounded-xl px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-rose-500">

                                    {SUPPORTED_LANGUAGES.map(code => (

                                        <option key={code} value={code}>{LANGUAGE_LABELS[code] || code.toUpperCase()}</option>

                                    ))}

                                </select>

                                <button onClick={swapLanguages} className="px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700">{t.swapLanguages}</button>

                            </div>

                        </div>

                    </div>



                    {kokugoFeedback && kokugoFeedback.type === 'error' && (

                        <div className="bg-red-100 text-red-700 rounded-xl px-4 py-2">{kokugoFeedback.message}</div>

                    )}



                    <div className="flex flex-wrap gap-3 justify-end">

                        <button onClick={() => setGameState('subjectSelect')} className="px-6 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600">{t.back}</button>

                        <button onClick={startKokugoSession} className="px-6 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transform hover:scale-105 transition-all">{t.startKokugo}</button>

                    </div>

                </div>

            </div>

        );

    }



    if (gameState === 'gradeSelect') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
                    <LanguageSelector />
                    <h2 className="text-4xl font-bold text-center mb-8 text-purple-600">🎓 {t.selectGrade} 🎓</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <button onClick={() => startGameWithGrade(2)} className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all">
                            <div className="text-5xl mb-4">📘</div>
                            <h3 className="text-2xl font-bold mb-3">{t.grade2Mode}</h3>
                            <p className="mb-2">{t.studyContent}</p>
                            <ul className="mt-2 text-left">
                                <li>✅ {t.addition}</li>
                                <li>✅ {t.subtraction}</li>
                                <li>✅ {t.comparison}</li>
                            </ul>
                        </button>
                        <button onClick={() => startGameWithGrade(3)} className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all">
                            <div className="text-5xl mb-4">📕</div>
                            <h3 className="text-2xl font-bold mb-3">{t.grade3Mode}</h3>
                            <p className="mb-2">{t.studyContent}</p>
                            <ul className="mt-2 text-left">
                                <li>✅ {t.multiplication}</li>
                                <li>✅ {t.division}</li>
                            </ul>
                        </button>
                    </div>
                    <div className="mt-6 text-center">
                        <button onClick={() => setGameState('menu')} className="bg-gray-500 text-white px-8 py-2 rounded-xl hover:bg-gray-600">{t.back}</button>
                    </div>
                    <div className="mt-4 text-center text-gray-600"><p>💡 {t.hint}</p></div>
                </div>
            </div>
        );
    }

    

if (gameState === 'modeSelect') {
    const focusSkills = gradeConfig && gradeConfig.focusSkills ? gradeConfig.focusSkills : [];
    const miniGames = Object.values(miniGameConfigs || {}).filter(game => !game.grade || game.grade === selectedGrade);
    const coopScenarios = gradeConfig && gradeConfig.cooperativeScenarios ? gradeConfig.cooperativeScenarios : [];
    const versusScenarios = gradeConfig && gradeConfig.versusScenarios ? gradeConfig.versusScenarios : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center p-4">
            <CheerToast />
            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl p-8 max-w-5xl w-full">
                <LanguageSelector />
                <h2 className="text-4xl font-bold text-center mb-6 text-purple-600">🎯 {t.modeSelectTitle || 'Choose your quest'} 🎯</h2>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <div className="rounded-2xl border border-purple-200 p-4 bg-purple-50">
                        <h3 className="text-xl font-semibold text-purple-700 mb-2">{t.focusSkillsTitle || 'Focus skills'}</h3>
                        <ul className="list-disc list-inside space-y-1 text-purple-900">
                            {focusSkills.map(skill => (
                                <li key={skill}>{skillLabel(skill)}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-indigo-200 p-4 bg-indigo-50">
                        <h3 className="text-xl font-semibold text-indigo-700 mb-2">{t.worldsTitle || 'Theme worlds'}</h3>
                        <div className="flex flex-wrap gap-2">
                            {availableWorlds.length === 0 && <span className="text-indigo-500">{t.notFound}</span>}
                            {availableWorlds.map(world => (
                                <div key={world.id} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow">
                                    <span className="text-2xl">{world.icon || '🗺️'}</span>
                                    <span>{world.title}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <button onClick={beginDungeonAdventure} className={`rounded-2xl border border-purple-200 p-5 bg-white/90 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl ${activeMode === 'dungeon' ? 'ring-4 ring-purple-400' : ''}`}>
                        <div className="text-4xl mb-2">🛡️</div>
                        <h3 className="text-xl font-bold">{t.modeDungeon || 'Dungeon Adventure'}</h3>
                        <p className="text-sm opacity-80">{t.modeDungeonDescription || 'Explore mazes and battle monsters with math.'}</p>
                    </button>
                    <button onClick={() => setActiveMode('miniGames')} className={`rounded-2xl border border-purple-200 p-5 bg-white/90 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl ${activeMode === 'miniGames' ? 'ring-4 ring-purple-400' : ''}`}>
                        <div className="text-4xl mb-2">🎮</div>
                        <h3 className="text-xl font-bold">{t.modeMiniGames || 'Mini Games'}</h3>
                        <p className="text-sm opacity-80">{t.modeMiniGamesDescription || 'Play focused puzzles to train each skill.'}</p>
                    </button>
                    <button onClick={() => setActiveMode('story')} className={`rounded-2xl border border-purple-200 p-5 bg-white/90 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl ${activeMode === 'story' ? 'ring-4 ring-purple-400' : ''}`}>
                        <div className="text-4xl mb-2">📖</div>
                        <h3 className="text-xl font-bold">{t.modeStory || 'Story Quest'}</h3>
                        <p className="text-sm opacity-80">{t.modeStoryDescription || 'Unlock chapters of the adventure and collect lore.'}</p>
                    </button>
                    <button onClick={() => setActiveMode('coop')} className={`rounded-2xl border border-purple-200 p-5 bg-white/90 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl ${activeMode === 'coop' ? 'ring-4 ring-purple-400' : ''}`}>
                        <div className="text-4xl mb-2">🤝</div>
                        <h3 className="text-xl font-bold">{t.modeCoop || 'Co-op Mission'}</h3>
                        <p className="text-sm opacity-80">{t.modeCoopDescription || 'Team up with a learning buddy to solve challenges.'}</p>
                    </button>
                    <button onClick={() => setActiveMode('versus')} className={`rounded-2xl border border-purple-200 p-5 bg-white/90 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl ${activeMode === 'versus' ? 'ring-4 ring-purple-400' : ''}`}>
                        <div className="text-4xl mb-2">⚔️</div>
                        <h3 className="text-xl font-bold">{t.modeVersus || 'Versus Arena'}</h3>
                        <p className="text-sm opacity-80">{t.modeVersusDescription || 'Race on the same problem set and compare scores.'}</p>
                    </button>
                    <button onClick={openParentDashboard} className={`rounded-2xl border border-purple-200 p-5 bg-white/90 shadow-lg transition transform hover:-translate-y-1 hover:shadow-2xl ${activeMode === 'parent' ? 'ring-4 ring-purple-400' : ''}`}>
                        <div className="text-4xl mb-2">📊</div>
                        <h3 className="text-xl font-bold">{t.modeParent || 'Parent Dashboard'}</h3>
                        <p className="text-sm opacity-80">{t.modeParentDescription || 'Check progress, badges, and set rewards.'}</p>
                    </button>
                </div>

                <div className="space-y-6">
                    {activeMode === 'miniGames' && (
                        <div>
                            <h3 className="text-2xl font-bold text-purple-600 mb-3">{t.miniGameTitle || 'Skill mini games'}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {miniGames.map(game => (
                                    <div key={game.id} className="mini-game-card">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-xl font-semibold text-blue-700">{game.title}</h4>
                                            <span className="text-sm text-blue-500">{skillLabel(skillForMiniGame(game))}</span>
                                        </div>
                                        <p className="text-sm mb-3 text-gray-600">{game.description || ''}</p>
                                        <button onClick={() => startMiniGameSession(game.id)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold">{t.miniGameStart || 'Start'}</button>
                                    </div>
                                ))}
                                {miniGames.length === 0 && <p className="text-gray-500">{t.notFound}</p>}
                            </div>
                        </div>
                    )}

                    {activeMode === 'story' && (
                        <div>
                            <h3 className="text-2xl font-bold text-rose-600 mb-3">{t.storyUnlock || 'Story chapters'}</h3>
                            <div className="space-y-3">
                                {storyBeatsForGrade.map(beat => {
                                    const unlocked = unlockedStoryIds.has(beat.id);
                                    return (
                                        <div key={beat.id} className={`story-beat ${unlocked ? 'bg-rose-50' : 'bg-gray-100'}`}>
                                            <div className="timeline-dot"></div>
                                            <div>
                                                <h4 className="font-semibold text-lg">{beat.title}</h4>
                                                <p className="text-sm text-gray-600">{beat.summary}</p>
                                                <button onClick={() => openStoryBeat(beat)} className="mt-2 text-sm px-3 py-1 rounded-full bg-rose-500 text-white">{unlocked ? (t.viewStory || 'View chapter') : (t.storyBegin || 'Unlock')}</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeMode === 'coop' && (
                        <div>
                            <h3 className="text-2xl font-bold text-emerald-600 mb-3">{t.modeCoop || 'Co-op Mission'}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {coopScenarios.map(scenario => (
                                    <div key={scenario.id} className="coop-card">
                                        <h4 className="font-semibold text-lg mb-2">{skillLabel(scenario.coreSkill)}</h4>
                                        <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                                        <button onClick={() => openCoopMission(scenario)} className="px-3 py-2 rounded-lg bg-emerald-500 text-white text-sm">{t.launchCoop || 'Start mission'}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeMode === 'versus' && (
                        <div>
                            <h3 className="text-2xl font-bold text-orange-600 mb-3">{t.modeVersus || 'Versus Arena'}</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {versusScenarios.map(scenario => (
                                    <div key={scenario.id} className="versus-card">
                                        <h4 className="font-semibold text-lg mb-2">{skillLabel(scenario.coreSkill)}</h4>
                                        <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                                        <button onClick={() => openVersusMatch(scenario)} className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm">{t.launchVersus || 'Start match'}</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


if (gameState === 'miniGame' && activeMiniGame && miniGameState) {
    const problem = miniGameState.problem;
    const options = problem && problem.options ? problem.options : null;
    const config = miniGameState.config;
    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-900 to-teal-900 flex items-center justify-center p-4">
            <CheerToast />
            <div className="bg-white/95 rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
                <h2 className="text-3xl font-bold text-center text-sky-600 mb-4">{config.title}</h2>
                <p className="text-center text-sm text-sky-500 mb-6">{config.description || ''}</p>
                {problem && (
                    <div className="space-y-4">
                        <div className="bg-sky-100 rounded-2xl p-6 text-center text-2xl font-semibold text-sky-800">
                            {problem.question}
                        </div>
                        {options ? (
                            <div className="grid grid-cols-2 gap-4">
                                {options.map((option, idx) => (
                                    <button key={idx} onClick={() => handleMiniGameChoice(option)} className="py-3 rounded-xl bg-gradient-to-r from-sky-500 to-teal-500 text-white text-xl font-bold">
                                        {option}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                <input value={miniGameAnswer} onChange={e => setMiniGameAnswer(e.target.value)} className="w-full border border-sky-200 rounded-xl px-4 py-3 text-center text-xl" placeholder={t.answer || 'Answer'} />
                                <button onClick={() => submitMiniGameAnswer(miniGameAnswer)} className="px-4 py-2 rounded-xl bg-sky-600 text-white font-semibold">{t.submit || 'Submit'}</button>
                            </div>
                        )}
                        {miniGameFeedback && <div className="encouragement-toast text-center">{miniGameFeedback}</div>}
                    </div>
                )}
                <div className="mt-6 flex justify-between text-sm text-gray-500">
                    <span>{t.miniGameSkill || 'Skill'}: {skillLabel(skillForMiniGame(config))}</span>
                    <span>{t.progress || 'Progress'}: {miniGameState.successCount}</span>
                </div>
                <button onClick={endMiniGameSession} className="mt-6 w-full bg-gray-500 text-white py-3 rounded-xl">{t.backToModes || 'Back to mode select'}</button>
            </div>
        </div>
    );
}

if (gameState === 'story' && storyScene) {
    const { beat, unlocked } = storyScene;
    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-900 to-purple-900 flex items-center justify-center p-4">
            <CheerToast />
            <div className="bg-white/90 rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
                <h2 className="text-3xl font-bold text-center text-rose-600 mb-3">{beat.title}</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{beat.summary}</p>
                <div className="mt-6 flex gap-3">
                    <button onClick={() => completeStoryBeat(beat)} className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold">{t.completeStory || 'Mark as completed'}</button>
                    <button onClick={() => { setStoryScene(null); setGameState('modeSelect'); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl">{t.backToModes || 'Back'}</button>
                </div>
                {!unlocked && <p className="text-xs text-rose-500 mt-2">{t.storyLocked || 'New chapter unlocked!'}</p>}
            </div>
        </div>
    );
}

if (gameState === 'coop' && coopSession) {
    const { scenario, problem } = coopSession;
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-900 to-blue-900 flex items-center justify-center p-4">
            <CheerToast />
            <div className="bg-white/95 rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
                <h2 className="text-3xl font-bold text-center text-emerald-600 mb-3">{t.modeCoop || 'Co-op Mission'}</h2>
                <p className="text-sm text-emerald-500 mb-4 text-center">{scenario.description}</p>
                {problem && (
                    <div className="bg-emerald-100 rounded-2xl p-6 mb-4 text-center text-2xl font-semibold text-emerald-800">
                        {problem.question}
                    </div>
                )}
                <input value={coopAnswer} onChange={e => setCoopAnswer(e.target.value)} className="w-full border border-emerald-200 rounded-xl px-4 py-3 text-center text-xl mb-3" placeholder={t.answer || 'Answer'} />
                <div className="flex gap-3">
                    <button onClick={() => submitCoopAnswer(coopAnswer)} className="flex-1 bg-emerald-600 text-white py-3 rounded-xl">{t.submit || 'Submit'}</button>
                    <button onClick={() => { setCoopSession(null); setGameState('modeSelect'); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl">{t.backToModes || 'Back'}</button>
                </div>
            </div>
        </div>
    );
}

if (gameState === 'versus' && versusSession) {
    const { scenario, problem } = versusSession;
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-900 to-red-900 flex items-center justify-center p-4">
            <CheerToast />
            <div className="bg-white/95 rounded-3xl shadow-2xl p-8 max-w-3xl w-full">
                <h2 className="text-3xl font-bold text-center text-orange-500 mb-3">{t.modeVersus || 'Versus Arena'}</h2>
                <p className="text-sm text-orange-500 mb-4 text-center">{scenario.description}</p>
                {problem && (
                    <div className="bg-orange-100 rounded-2xl p-6 mb-4 text-center text-2xl font-semibold text-orange-800">
                        {problem.question}
                    </div>
                )}
                <input value={versusAnswer} onChange={e => setVersusAnswer(e.target.value)} className="w-full border border-orange-200 rounded-xl px-4 py-3 text-center text-xl mb-3" placeholder={t.answer || 'Answer'} />
                <div className="flex gap-3">
                    <button onClick={() => submitVersusAnswer(versusAnswer)} className="flex-1 bg-orange-500 text-white py-3 rounded-xl">{t.submit || 'Submit'}</button>
                    <button onClick={() => { setVersusSession(null); setGameState('modeSelect'); }} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl">{t.backToModes || 'Back'}</button>
                </div>
            </div>
        </div>
    );
}

if (gameState === 'parentDashboard') {
    const weekly = playerStats.weeklyProgress || [];
    const miniRecords = playerStats.miniGameRecords || {};
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center p-4">
            <CheerToast />
            <div className="bg-white/95 rounded-3xl shadow-2xl p-8 max-w-5xl w-full">
                <h2 className="text-3xl font-bold text-center text-purple-600 mb-6">{t.parentDashboard || 'Parent Dashboard'}</h2>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-2xl border border-purple-200 p-4 bg-purple-50">
                        <h3 className="text-sm text-gray-500 uppercase tracking-wide">{t.levelLabel || 'Level'}</h3>
                        <p className="text-3xl font-bold text-purple-600">{playerStats.level}</p>
                        <p className="text-xs text-gray-500">{t.nextReward || 'Next reward at'} {playerStats.nextLevelExp - playerStats.experience} XP</p>
                    </div>
                    <div className="rounded-2xl border border-green-200 p-4 bg-green-50">
                        <h3 className="text-sm text-gray-500 uppercase tracking-wide">{t.pointsLabel || 'Points'}</h3>
                        <p className="text-3xl font-bold text-green-600">{playerStats.points}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-200 p-4 bg-sky-50">
                        <h3 className="text-sm text-gray-500 uppercase tracking-wide">{t.totalQuestions || 'Questions answered'}</h3>
                        <p className="text-3xl font-bold text-sky-600">{playerStats.totalQuestionsAnswered}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="rounded-2xl border border-purple-200 p-4">
                        <h3 className="text-lg font-semibold text-purple-600 mb-2">{t.weeklyProgress || 'Weekly progress'}</h3>
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {weekly.slice().reverse().map(week => (
                                <li key={week.week} className="flex justify-between text-sm">
                                    <span>{week.week}</span>
                                    <span>{week.correct}/{week.answered} ({week.points} pts)</span>
                                </li>
                            ))}
                            {weekly.length === 0 && <li className="text-gray-500 text-sm">{t.notFound}</li>}
                        </ul>
                    </div>
                    <div className="rounded-2xl border border-purple-200 p-4">
                        <h3 className="text-lg font-semibold text-purple-600 mb-2">{t.miniGameStat || 'Mini game streaks'}</h3>
                        <ul className="space-y-2 max-h-48 overflow-y-auto">
                            {Object.keys(miniRecords).length === 0 && <li className="text-gray-500 text-sm">{t.notFound}</li>}
                            {Object.entries(miniRecords).map(([id, record]) => (
                                <li key={id} className="flex justify-between text-sm">
                                    <span>{id}</span>
                                    <span>{record.wins} / {record.attempts}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <button onClick={() => setGameState('modeSelect')} className="mt-6 w-full bg-gray-500 text-white py-3 rounded-xl">{t.backToModes || 'Back to mode select'}</button>
            </div>
        </div>
    );
}
if (gameState === 'map') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-900 to-lime-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
                    <LanguageSelector />
                    <h2 className="text-3xl font-bold text-center mb-6 text-green-700">🗺️ {t.selectArea} 🗺️</h2>
                    <div className="flex flex-col gap-4">
                        {['urawa', 'omiya', 'iwatsuki'].map(area => (
                            <button key={area} onClick={() => { setSelectedArea(area); setGameState('area'); }} className="bg-gradient-to-r from-green-500 to-lime-500 text-white text-xl font-bold py-3 rounded-2xl hover:from-green-600 hover:to-lime-600">
                                {t[area]}
                            </button>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <button onClick={() => setGameState('menu')} className="bg-gray-500 text-white px-8 py-2 rounded-xl hover:bg-gray-600">{t.back}</button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'area' && selectedArea) {
        const insectKey = areaInsects[selectedArea].insect;
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-900 to-lime-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
                    <LanguageSelector />
                    <h2 className="text-3xl font-bold text-center mb-6 text-green-700">{t[selectedArea]}</h2>
                    <div className="text-center mb-6">
                        <p className="text-2xl">{t[insectKey]}</p>
                        <p className="mt-2">{t[`${insectKey}Fact`]}</p>
                    </div>
                    <div className="flex flex-col gap-4 items-center">
                        <button onClick={() => startCapture(insectKey)} className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600">{t.attemptCapture}</button>
                        <button onClick={() => setGameState('map')} className="bg-gray-500 text-white px-6 py-2 rounded-xl hover:bg-gray-600">{t.back}</button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'insectQuiz' && captureQuestion) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-900 to-lime-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
                    <LanguageSelector />
                    <h2 className="text-3xl font-bold text-center mb-6 text-green-700">{t.captureInsect}</h2>
                    <div className="text-center text-2xl mb-6">{captureQuestion.question}</div>
                    {captureResult ? (
                        <div className="text-center text-2xl mb-6">{captureResult === 'success' ? t.captureSuccess : t.captureFail}</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {captureQuestion.options.map((opt, idx) => (
                                <button key={idx} onClick={() => checkCaptureAnswer(opt)} className="bg-purple-500 text-white text-3xl font-bold py-4 rounded-2xl hover:scale-105 transition-all">{opt}</button>
                            ))}
                        </div>
                    )}
                    <div className="text-center">
                        <button onClick={() => setGameState('map')} className="bg-gray-500 text-white px-8 py-2 rounded-xl hover:bg-gray-600">{captureResult ? t.selectArea : t.back}</button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'kokugoQuestion' && kokugoSession && kokugoSession.current) {

        const difficultyLabels = {

            easy: t.difficultyEasy,

            normal: t.difficultyNormal,

            hard: t.difficultyHard

        };

        const { question, support, revealedHints } = kokugoSession.current;

        const hints = question.hints || [];

        const progressText = formatText(t.questionProgress, { current: kokugoSession.index + 1, total: kokugoSession.total });

        const hintsText = hints.length > 0 ? formatText(t.hintsRemaining, { remaining: Math.max(hints.length - (revealedHints || 0), 0), total: hints.length }) : null;

        const isLastQuestion = kokugoSession.index + 1 >= kokugoSession.total;

        const nextLabel = isLastQuestion ? (t.kokugoViewResults || t.kokugoSummaryMenu || 'OK') : (t.nextQuestion || t.nextLevel);

        const supportLangLabel = support && support.lang ? (LANGUAGE_LABELS[support.lang] || support.lang.toUpperCase()) : '';



        return (

            <div className="min-h-screen bg-gradient-to-br from-red-800 via-purple-900 to-indigo-900 flex items-center justify-center p-4">

                <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-4xl w-full space-y-6">

                    <LanguageSelector />

                    <div className="flex flex-wrap justify-between items-center gap-3">

                        <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">{progressText}</span>

                        <span className="text-sm text-gray-500">{difficultyLabels[kokugoDifficulty]}</span>

                    </div>



                    <div className="bg-purple-100 rounded-2xl p-6">

                        <p className="text-2xl font-bold text-purple-800 whitespace-pre-wrap">{question.prompt}</p>

                    </div>



                    <div className="flex flex-wrap gap-3">

                        <button onClick={() => speak(question.tts?.text || question.prompt, question.tts?.lang || getSpeechLocale(kokugoSession.lang))} className="px-4 py-2 rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50" disabled={!question.prompt}>{isTTSSpeaking ? t.ttsStop : t.ttsPlay}</button>

                        <button onClick={stopSpeech} className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700 hover:bg-gray-400">{t.ttsStop}</button>

                        {hints.length > 0 && (

                            <button onClick={showNextKokugoHint} className="px-4 py-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50" disabled={revealedHints >= hints.length}>{t.viewHint}</button>

                        )}

                        {kokugoHintVisible && hints.length > 0 && (

                            <button onClick={hideKokugoHints} className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300">{t.hideHint}</button>

                        )}

                        {hintsText && <span className="text-sm text-gray-500 self-center">{hintsText}</span>}

                    </div>



                    <div className="grid sm:grid-cols-2 gap-3">

                        {(question.choices || []).map(choice => {

                            const key = typeof choice === 'string' ? choice : String(choice);

                            const isSelected = kokugoAnswer === key;

                            return (

                                <button

                                    key={key}

                                    onClick={() => handleKokugoAnswer(choice)}

                                    className={`px-4 py-3 rounded-2xl text-lg font-semibold border-2 transition-all ${isSelected ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-purple-300 text-purple-700 hover:border-rose-400'}`}

                                    disabled={kokugoAnswer !== ''}

                                >{choice}</button>

                            );

                        })}

                    </div>



                    {kokugoHintVisible && hints.length > 0 && (

                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">

                            <h4 className="font-semibold text-amber-700 mb-2">{t.hint}</h4>

                            <ul className="space-y-1 text-amber-700">

                                {hints.slice(0, revealedHints || 0).map((hint, index) => (

                                    <li key={index}>• {hint}</li>

                                ))}

                            </ul>

                        </div>

                    )}



                    {support && (

                        <div className="bg-gray-100 rounded-2xl p-4">

                            <h4 className="font-semibold text-gray-600 mb-1">{formatText(t.supportPrompt, { lang: supportLangLabel })}</h4>

                            <p className="text-gray-700">{support.prompt}</p>

                        </div>

                    )}



                    {kokugoFeedback && (

                        <div className={`rounded-2xl p-4 text-lg font-semibold ${kokugoFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{kokugoFeedback.message}</div>

                    )}



                    {kokugoAnswer !== '' && question.explanation && (

                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-blue-700">{question.explanation}</div>

                    )}



                    <div className="flex justify-end">

                        <button onClick={goToNextKokugoQuestion} className="px-6 py-2 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50" disabled={kokugoAnswer === ''}>{nextLabel}</button>

                    </div>

                </div>

            </div>

        );

    }



    if (gameState === 'maze') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-950 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-purple-900/80 rounded-2xl p-4 mb-4">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="text-2xl font-bold text-white">{t.level} {currentLevel}</div>
                            <div className="text-xl text-yellow-400">⚔️ {t.defeated}: {defeatedMonsters.length}/{monsterPositions.length}</div>
                            <button onClick={() => setGameState('menu')} className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600">{t.menu}</button>
                        </div>
                        {requiredBosses.length > 0 && (
                            <div className="mt-2 text-center">
                                {requiredBosses.every(id => defeatedMonsters.includes(id)) ? (
                                    <span className="text-green-400 font-bold text-lg animate-pulse">✨ {t.defeatedBoss} ✨</span>
                                ) : (
                                    <span className="text-orange-400 font-bold text-lg animate-pulse">⚠️ {t.needDefeatBoss} ⚠️</span>
                                )}
                            </div>
                        )}
                    </div>

                    {message && (
                        <div className="bg-yellow-500 text-white text-center text-2xl font-bold p-3 rounded-xl mb-4 animate-bounce">{message}</div>
                    )}

                    <div className="bg-slate-900 rounded-3xl p-8">
                        <h3 className="text-2xl font-bold text-center mb-4 text-white">⚔️ {t.dungeonExploring} ⚔️</h3>

                        <div className="grid gap-1 mx-auto" style={{ gridTemplateColumns: `repeat(${mazeSize}, minmax(0, 1fr))`, maxWidth: `${mazeSize * 60}px` }}>
                            {maze.map((row, y) => row.map((cell, x) => {
                                const isPlayer = playerPosition.x === x && playerPosition.y === y;
                                const monster = monsterPositions.find(m => m.x === x && m.y === y && !defeatedMonsters.includes(m.id));
                                const isGoal = x === mazeSize - 1 && y === mazeSize - 1;
                                const isGate = cell === 3;
                                const isBossMonster = monster && monster.isBoss;

                                return (
                                    <div key={`${x}-${y}`} className={`aspect-square flex items-center justify-center rounded text-3xl ${cell === 1 ? 'bg-gray-800' : 'bg-teal-900/40'} ${isGoal && !isPlayer ? 'bg-gradient-to-br from-yellow-500 to-orange-500' : ''} ${isGate ? 'bg-gradient-to-br from-red-900 to-orange-800' : ''}`}>
                                        {isPlayer && <span className="animate-hero">🦸</span>}
                                        {monster && <span className={isBossMonster ? "animate-boss" : "animate-monster"}>{monster.type.emoji}</span>}
                                        {isGoal && !isPlayer && <span className="animate-goal">🏁</span>}
                                        {isGate && !isPlayer && <span className="text-2xl">🔒</span>}
                                    </div>
                                );
                            }))}
                        </div>

                        <div className="mt-6 flex justify-center gap-2 text-sm">
                            <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full text-white"><div className="w-4 h-4 bg-blue-500 rounded"></div><span>{t.you}</span></div>
                            <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full text-white"><div className="w-4 h-4 bg-red-500 rounded"></div><span>{t.monster}</span></div>
                            <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full text-white"><div className="w-4 h-4 bg-purple-500 rounded"></div><span>{t.boss}</span></div>
                        </div>

                        <div className="mt-6 flex flex-col items-center">
                            <button onClick={() => movePlayer('up')} className="bg-blue-600 text-white p-3 rounded-xl mb-2 hover:bg-blue-700">⬆️</button>
                            <div className="flex gap-2">
                                <button onClick={() => movePlayer('left')} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700">⬅️</button>
                                <button onClick={() => movePlayer('down')} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700">⬇️</button>
                                <button onClick={() => movePlayer('right')} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700">➡️</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'battle' && currentMonster && battleState) {
        return (
            <div className={`min-h-screen ${currentMonster.isBoss ? 'bg-gradient-to-b from-purple-600 to-red-600' : 'bg-gradient-to-b from-red-400 to-orange-400'} flex items-center justify-center p-4`}>
                <CheerToast />
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
                    <div className="text-center mb-6">
                        <div className={`${currentMonster.isBoss ? 'text-8xl' : 'text-6xl'} mb-4`}>{currentMonster.type.emoji}</div>
                        <h2 className="text-3xl font-bold text-purple-600">
                            {currentMonster.isBoss && `💀 ${t.bossBattle} 💀`}
                            {!currentMonster.isBoss && `${currentMonster.type.name}${t.appeared}`}
                            {currentMonster.isBoss && <div className="text-2xl mt-2">{currentMonster.type.name}</div>}
                        </h2>
                        <p className="text-xl mt-2">{currentMonster.type.description}</p>
                    </div>

                    <div className="flex justify-center gap-2 mb-6">
                        {[...Array(battleState.maxHealth)].map((_, i) => (
                            <span key={i} className={`heart ${i < battleState.monsterHealth ? 'filled' : 'empty'}`}>❤️</span>
                        ))}
                    </div>

                    <div className={`text-center text-3xl font-bold mb-6 ${timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>{t.timeLeft}: {timeLeft}{t.seconds}</div>

                    <div className="bg-blue-100 rounded-2xl p-6 mb-6">
                        <div className="text-4xl font-bold text-center text-blue-800">{battleState.currentProblem.question}</div>
                    </div>

                    {message && <div className={`text-center text-2xl font-bold mb-4 ${message.includes(t.correct) ? 'text-green-600' : 'text-orange-600'}`}>{message}</div>}

                    {battleState.currentProblem.hint && (
                        <div className="text-center mb-4">
                            <button onClick={() => setShowHint(!showHint)} className="bg-yellow-300 text-yellow-800 font-bold px-4 py-2 rounded-lg hover:bg-yellow-400">{showHint ? t.hideHint : t.viewHint}</button>
                        </div>
                    )}

                    {showHint && battleState.currentProblem.hint && (
                        <div className="text-center text-xl text-yellow-800 mb-4">{battleState.currentProblem.hint}</div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {battleState.currentProblem.options.map((option, index) => (
                            <button key={index} onClick={() => checkAnswer(option)} className={`${currentMonster.isBoss ? 'bg-gradient-to-r from-purple-600 to-red-600' : 'bg-gradient-to-r from-purple-500 to-pink-500'} text-white text-3xl font-bold py-6 rounded-2xl hover:scale-105 transition-all`} disabled={message !== ''}>
                                {option}
                            </button>
                        ))}
                    </div>

                    {currentMonster.isBoss && <div className="mt-4 text-center text-red-600 font-bold animate-pulse">⚠️ {t.bossWarning} ⚠️</div>}
                </div>
            </div>
        );
    }

    if (gameState === 'kokugoSummary') {

        const typeLabels = {

            reading: t.questionTypeReading,

            kanji: t.questionTypeKanji,

            vocab: t.questionTypeVocab,

            comprehension: t.questionTypeComprehension,

            grammar: t.questionTypeGrammar

        };

        const total = kokugoHistory.length;

        const correct = kokugoHistory.filter(item => item.isCorrect).length;

        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

        const comprehensionTotal = kokugoHistory.filter(item => item.type === 'comprehension').length;

        const comprehensionCorrect = kokugoHistory.filter(item => item.type === 'comprehension' && item.isCorrect).length;

        const comprehensionAccuracy = comprehensionTotal > 0 ? Math.round((comprehensionCorrect / comprehensionTotal) * 100) : 0;



        return (

            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">

                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full space-y-6">

                    <LanguageSelector />

                    <h2 className="text-4xl font-bold text-center text-purple-600">🎉 {t.kokugoSummaryTitle} 🎉</h2>

                    <div className="grid sm:grid-cols-2 gap-4">

                        <div className="bg-emerald-100 text-emerald-700 rounded-2xl p-4 text-center font-semibold text-xl">{t.kokugoSummaryAccuracy}: {accuracy}%</div>

                        <div className="bg-indigo-100 text-indigo-700 rounded-2xl p-4 text-center font-semibold text-xl">{t.kokugoSummaryCorrect}: {correct} / {total}</div>

                        <div className="bg-amber-100 text-amber-700 rounded-2xl p-4 text-center font-semibold text-xl">{t.comprehensionAccuracy}: {comprehensionAccuracy}%</div>

                    </div>



                    <div>

                        <h3 className="text-2xl font-bold text-gray-700 mb-3">{t.kokugoSummaryDetails}</h3>

                        <div className="max-h-80 overflow-y-auto space-y-3">

                            {kokugoHistory.map((entry, index) => (

                                <div key={entry.id + index} className="border border-purple-200 rounded-2xl p-4 bg-purple-50 text-purple-800">

                                    <div className="flex justify-between items-center mb-2">

                                        <span className="font-semibold">#{index + 1} {entry.type ? (typeLabels[entry.type] || entry.type) : ''}</span>

                                        <span className={entry.isCorrect ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{entry.isCorrect ? '◎' : '✕'}</span>

                                    </div>

                                    <p className="font-bold mb-1">{entry.prompt}</p>

                                    <p className="text-sm mb-1">{t.correctAnswers}: {entry.answer}</p>

                                    <p className="text-sm mb-1">{t.question}: {entry.selected}</p>

                                    {entry.explanation && <p className="text-sm text-gray-700">{entry.explanation}</p>}

                                </div>

                            ))}

                        </div>

                    </div>



                    <div className="flex flex-wrap gap-3 justify-end">

                        <button onClick={startKokugoSession} className="px-6 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transform hover:scale-105 transition-all">{t.kokugoSummaryAgain}</button>

                        <button onClick={() => setGameState('subjectSelect')} className="px-6 py-2 rounded-xl bg-gray-500 text-white hover:bg-gray-600">{t.kokugoSummaryMenu}</button>

                    </div>

                </div>

            </div>

        );

    }



    if (gameState === 'victory') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-400 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full text-center">
                    <div className="text-6xl mb-4">🎉🏆🎉</div>
                    <h1 className="text-5xl font-bold text-purple-600 mb-6">{t.level} {currentLevel} {t.clearMessage}</h1>
                    <div className="bg-blue-100 rounded-2xl p-6 mb-6">
                        <p className="text-2xl mb-2">{t.defeated}: {defeatedMonsters.length}{t.body}</p>
                        <p className="text-2xl">{t.accuracy}: {playerStats.totalQuestionsAnswered > 0 ? Math.round((playerStats.correctAnswers / playerStats.totalQuestionsAnswered) * 100) : 0}%</p>
                    </div>

                    {playerStats.badges.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-2xl font-bold mb-3">{t.badges}</h3>
                            <div className="flex justify-center gap-3">
                                {playerStats.badges.includes('first_clear') && <div className="text-center"><div className="text-5xl">⭐</div><p className="text-sm mt-1">{t.firstClear}</p></div>}
                                {playerStats.badges.includes('perfect_clear') && <div className="text-center"><div className="text-5xl">🏆</div><p className="text-sm mt-1">{t.perfectClear}</p></div>}
                                {playerStats.badges.includes('multiplication_master') && <div className="text-center"><div className="text-5xl">🌟</div><p className="text-sm mt-1">{t.multiplicationMaster}</p></div>}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <button onClick={nextLevel} className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-3xl font-bold py-6 rounded-2xl hover:from-green-600 hover:to-blue-600">{t.nextLevel}</button>
                        <button onClick={() => setGameState('menu')} className="bg-gray-500 text-white text-2xl font-bold py-4 rounded-2xl hover:bg-gray-600">{t.menu}</button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'stats') {
        const subjects = [
            { key: 'math', label: t.subjectMath },
            { key: 'kokugo', label: t.subjectKokugo }
        ];
        const achievementList = [
            { key: 'langNovice', label: t.badgeLangNovice, icon: '📘' },
            { key: 'readingChamp', label: t.badgeReadingChamp, icon: '📚' },
            { key: 'bugCatcher', label: t.badgeBugCatcher, icon: '🪲' }
        ];

        return (
            <div className="min-h-screen bg-gradient-to-b from-purple-400 to-blue-400 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-5xl w-full space-y-8">
                    <LanguageSelector />
                    <h2 className="text-4xl font-bold text-center mb-4 text-purple-600">🏆 {t.yourStats}</h2>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-blue-100 rounded-xl p-4 text-center"><p className="text-lg font-semibold text-blue-800">🎯 {t.totalDefeated}</p><p className="text-3xl font-bold text-blue-900">{playerStats.totalMonstersDefeated}</p></div>
                        <div className="bg-green-100 rounded-xl p-4 text-center"><p className="text-lg font-semibold text-green-800">📝 {t.totalQuestions}</p><p className="text-3xl font-bold text-green-900">{playerStats.totalQuestionsAnswered}</p></div>
                        <div className="bg-yellow-100 rounded-xl p-4 text-center"><p className="text-lg font-semibold text-yellow-800">✅ {t.correctAnswers}</p><p className="text-3xl font-bold text-yellow-900">{playerStats.correctAnswers}</p></div>
                        <div className="bg-purple-100 rounded-xl p-4 text-center"><p className="text-lg font-semibold text-purple-800">📊 {t.accuracy}</p><p className="text-3xl font-bold text-purple-900">{playerStats.totalQuestionsAnswered > 0 ? Math.round((playerStats.correctAnswers / playerStats.totalQuestionsAnswered) * 100) : 0}%</p></div>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-gray-700 mb-2">{t.languageStatsTitle}</h3>
                        <p className="text-sm text-gray-500 mb-3">{t.languageStatsDescription}</p>
                        <div className="space-y-4">
                            {subjects.map(subject => {
                                const subjectStats = playerStats.languageStats[subject.key];
                                if (!subjectStats) return null;
                                return (
                                    <div key={subject.key} className="border border-purple-200 rounded-2xl overflow-hidden">
                                        <div className="bg-purple-100 px-4 py-2 font-semibold text-purple-700">{subject.label}</div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50 text-gray-600 uppercase tracking-wide">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">{t.languageColumn}</th>
                                                        <th className="px-4 py-2 text-left">{t.answeredColumn}</th>
                                                        <th className="px-4 py-2 text-left">{t.correctColumn}</th>
                                                        <th className="px-4 py-2 text-left">{t.accuracyColumn}</th>
                                                        {subject.key === 'kokugo' && <th className="px-4 py-2 text-left">{t.comprehensionAccuracy}</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {SUPPORTED_LANGUAGES.map(code => {
                                                        const stats = subjectStats[code];
                                                        if (!stats) return null;
                                                        const answered = stats.answered || 0;
                                                        const correct = stats.correct || 0;
                                                        const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
                                                        const compAnswered = stats.comprehensionAnswered || 0;
                                                        const compCorrect = stats.comprehensionCorrect || 0;
                                                        const compAccuracy = compAnswered > 0 ? Math.round((compCorrect / compAnswered) * 100) : 0;
                                                        return (
                                                            <tr key={code} className="odd:bg-white even:bg-gray-50 text-gray-700">
                                                                <td className="px-4 py-2 font-semibold">{LANGUAGE_LABELS[code] || code.toUpperCase()}</td>
                                                                <td className="px-4 py-2">{answered}</td>
                                                                <td className="px-4 py-2">{correct}</td>
                                                                <td className="px-4 py-2">{accuracy}%</td>
                                                                {subject.key === 'kokugo' && <td className="px-4 py-2">{compAccuracy}% ({compCorrect}/{compAnswered})</td>}
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {achievementList.map(ach => {
                            const unlocked = playerStats.achievements && playerStats.achievements[ach.key];
                            return (
                                <div key={ach.key} className={`rounded-2xl p-4 text-center border-2 ${unlocked ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                                    <div className="text-4xl">{ach.icon}</div>
                                    <p className="mt-2 font-semibold">{ach.label}</p>
                                    <p className="text-xs mt-1">{unlocked ? t.congratulations : t.notFound}</p>
                                </div>
                            );
                        })}
                    </div>

                    {playerStats.badges.length > 0 && (
                        <div>
                            <h3 className="text-2xl font-bold mb-3 text-gray-700 text-center">{t.badges}</h3>
                            <div className="flex justify-center gap-4 flex-wrap">
                                {playerStats.badges.includes('first_clear') && <div className="text-center"><div className="text-6xl">⭐</div><p className="text-sm mt-1">{t.firstClear}</p></div>}
                                {playerStats.badges.includes('perfect_clear') && <div className="text-center"><div className="text-6xl">🏆</div><p className="text-sm mt-1">{t.perfectClear}</p></div>}
                                {playerStats.badges.includes('multiplication_master') && <div className="text-center"><div className="text-6xl">🌟</div><p className="text-sm mt-1">{t.multiplicationMaster}</p></div>}
                            </div>
                        </div>
                    )}

                    <button onClick={() => setGameState('menu')} className="w-full bg-gray-500 text-white text-2xl font-bold py-4 rounded-2xl hover:bg-gray-600">{t.back}</button>
                </div>
            </div>
        );
    }



    if (gameState === 'dictionary') {
        const monsterTypes = getMonsterTypes();
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-400 to-blue-400 flex items-center justify-center p-4">
                <CheerToast />
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
                    <LanguageSelector />
                    <h2 className="text-4xl font-bold text-center mb-6 text-purple-600">📖 {t.dictionary}</h2>

                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {monsterTypes.map(monster => {
                            const isUnlocked = playerStats.unlockedMonsters.includes(monster.id);
                            return (
                                <div key={monster.id} className={`rounded-xl p-4 ${isUnlocked ? monster.isBoss ? 'bg-gradient-to-r from-purple-200 to-red-200 border-2 border-purple-400' : 'bg-gradient-to-r from-purple-100 to-pink-100' : 'bg-gray-100'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`${monster.isBoss ? 'text-6xl' : 'text-5xl'}`}>{isUnlocked ? monster.emoji : '❓'}</div>
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold flex items-center gap-2">{isUnlocked ? monster.name : '？？？'}{isUnlocked && monster.isBoss && <span className="text-purple-600">👑 {t.boss}</span>}</h3>
                                            <p className="text-lg text-gray-600">{isUnlocked ? monster.description : t.notFound}</p>
                                            {isUnlocked && monster.isBoss && <p className="text-sm text-purple-600 mt-1">{t.hp}: {monster.health} ❤️</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 text-center text-gray-600"><p className="text-xl font-bold">{playerStats.unlockedMonsters.length} / {getMonsterTypes().length} {t.found}</p></div>

                    <button onClick={() => setGameState('menu')} className="mt-6 w-full bg-gray-500 text-white text-2xl font-bold py-4 rounded-2xl hover:bg-gray-600">{t.back}</button>
                </div>
            </div>
        );
    }

    return null;
};

// Render


export default MathMazeGame;
