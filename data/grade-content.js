(() => {
    const gradeCurriculum = {
        2: {
            displayName: '2年生',
            focusSkills: [
                'くり上がり・くり下がりのあるたし算・ひき算',
                '時計の読み取り（5分刻み）',
                '日本の硬貨・紙幣の組み合わせ',
                '偶数と奇数の見分け',
                '大小比較と100までの数直線'
            ],
            battleTypes: ['addition_carry', 'subtraction_borrow', 'clock_reading', 'money_counting', 'even_odd'],
            featuredWorlds: ['forest', 'river', 'market'],
            quests: [
                { id: 'carry-bridge', title: 'くり上がりの橋を渡れ', description: '合計が10をこえる計算で魔法の橋を完成させよう。' },
                { id: 'clock-treasure', title: '時間の宝箱', description: '時計を合わせて宝箱の錠を外すパズルに挑戦。' },
                { id: 'coin-bazaar', title: 'コインバザール', description: '指定された金額になるように硬貨を並べて商人を手伝おう。' }
            ],
            cooperativeScenarios: [
                { id: 'relay-addition', coreSkill: 'addition_carry', description: '交代で一桁ずつ計算し、正しい合計を導き出すリレー形式。' },
                { id: 'clock-helper', coreSkill: 'clock_reading', description: '片方がヒントカードを読み、もう片方が時計を操作する。' }
            ],
            versusScenarios: [
                { id: 'even-odd-race', coreSkill: 'even_odd', description: '同じ数字カードを同時に分類し、スピードと正確性を競う。' }
            ]
        },
        3: {
            displayName: '3年生',
            focusSkills: [
                '九九と関連する掛け算',
                '簡単なわり算とあまりの理解',
                '文章題からの式づくり',
                '長さ・重さ・時間の単位換算',
                'グラフや表の読み取り'
            ],
            battleTypes: ['multiplication_array', 'division_basic', 'word_problem', 'unit_conversion', 'data_reading'],
            featuredWorlds: ['volcano', 'ocean', 'space'],
            quests: [
                { id: 'times-table-temple', title: '九九の神殿', description: 'サイコロを振って出た段の問題を制覇し、神殿の扉を開けよう。' },
                { id: 'unit-lab', title: '単位ラボ', description: '長さや重さを正しい単位に変換して研究を完成させる。' },
                { id: 'story-safari', title: '文章題サファリ', description: '短い物語を読み、式と答えを導き出して動物たちを救おう。' }
            ],
            cooperativeScenarios: [
                { id: 'story-solver-duo', coreSkill: 'word_problem', description: '一人が文章を読み、もう一人が式を組み立てる役割分担協力。' },
                { id: 'unit-conversion-tag', coreSkill: 'unit_conversion', description: '交互に単位を変換し、連続正解でコンボボーナス。' }
            ],
            versusScenarios: [
                { id: 'array-blitz', coreSkill: 'multiplication_array', description: '同じ掛け算を配列で素早く表現するバトル。' },
                { id: 'data-dash', coreSkill: 'data_reading', description: '同じグラフを基にした問題を解き、正答数とスピードで勝負。' }
            ]
        }
    };

    const themeWorlds = [
        { id: 'forest', grade: 2, icon: '🌳', title: '森のまなびの小径', focus: ['addition_carry', 'comparison'], mapSize: 5, ambient: 'birds' },
        { id: 'river', grade: 2, icon: '🏞️', title: 'クリスタルリバー', focus: ['clock_reading', 'money_counting'], mapSize: 6, ambient: 'water' },
        { id: 'market', grade: 2, icon: '🛍️', title: 'コインマーケット', focus: ['money_counting'], mapSize: 5, ambient: 'crowd' },
        { id: 'volcano', grade: 3, icon: '🌋', title: 'フレイムボルケーノ', focus: ['multiplication_array'], mapSize: 7, ambient: 'fire' },
        { id: 'ocean', grade: 3, icon: '🌊', title: 'ディープブルーオーシャン', focus: ['division_basic', 'unit_conversion'], mapSize: 7, ambient: 'waves' },
        { id: 'space', grade: 3, icon: '🪐', title: 'スタースカイコスモス', focus: ['word_problem', 'data_reading'], mapSize: 8, ambient: 'space' }
    ];

    const badgeCatalog = [
        { id: 'carry_master', label: 'Carry Master', grade: 2, requirement: { type: 'streak', skill: 'addition_carry', count: 10 }, reward: { points: 200, shopUnlock: 'sparkle_robes' } },
        { id: 'coin_artist', label: 'Coin Artist', grade: 2, requirement: { type: 'miniGame', miniGame: 'coin_count', wins: 5 }, reward: { points: 150, shopUnlock: 'coin_pouch' } },
        { id: 'clock_guardian', label: 'Clock Guardian', grade: 2, requirement: { type: 'miniGame', miniGame: 'clock_match', wins: 5 }, reward: { points: 150, shopUnlock: 'time_staff' } },
        { id: 'times_table_hero', label: 'Times Table Hero', grade: 3, requirement: { type: 'streak', skill: 'multiplication_array', count: 12 }, reward: { points: 250, shopUnlock: 'galaxy_cloak' } },
        { id: 'unit_wizard', label: 'Unit Wizard', grade: 3, requirement: { type: 'miniGame', miniGame: 'unit_conversion_lab', wins: 5 }, reward: { points: 200, shopUnlock: 'metric_toolkit' } },
        { id: 'story_scholar', label: 'Story Scholar', grade: 3, requirement: { type: 'storyClear', episodes: 6 }, reward: { points: 300, shopUnlock: 'legendary_quill' } }
    ];

    const shopInventory = [
        { id: 'sparkle_robes', type: 'outfit', label: 'きらめくローブ', price: 400, grade: 2, rarity: 'rare' },
        { id: 'coin_pouch', type: 'accessory', label: 'コインポーチ', price: 250, grade: 2, rarity: 'common' },
        { id: 'time_staff', type: 'tool', label: 'タイムスタッフ', price: 350, grade: 2, rarity: 'rare' },
        { id: 'galaxy_cloak', type: 'outfit', label: 'ギャラクシークローク', price: 500, grade: 3, rarity: 'legendary' },
        { id: 'metric_toolkit', type: 'tool', label: 'メトリックツールキット', price: 320, grade: 3, rarity: 'rare' },
        { id: 'legendary_quill', type: 'accessory', label: '伝説の羽根ペン', price: 450, grade: 3, rarity: 'epic' }
    ];

    const aiTutorProfiles = {
        adaptiveCoach: {
            id: 'adaptiveCoach',
            name: 'ミミ先生',
            persona: 'Funexpected風AIチューター',
            behaviors: {
                evaluate: '正答率と解答時間を見てスキルごとの難易度を調整します。',
                hintStyle: '質問で気づきを促すガイド型ヒントを3段階で提示。',
                encouragement: ['すばらしいひらめきだね！', 'もう少しで正解だよ。一緒に考えよう。', '次はきっとできるよ！']
            },
            thresholds: {
                promote: { accuracy: 0.85, speedSeconds: 8 },
                support: { accuracy: 0.6, speedSeconds: 20 }
            }
        },
        cheerBuddy: {
            id: 'cheerBuddy',
            name: 'ピピ',
            persona: '応援フェアリー',
            cheers: {
                correct: ['キラキラポイントが増えたよ！', 'やったね、すごい！', 'その調子！星がまたひとつ輝いたよ。'],
                incorrect: ['へいきへいき、次は大丈夫！', 'ちょっと休憩してリズムを整えよう。', 'ヒントを使ってみようか？']
            }
        }
    };

    const miniGameConfigs = {
        clock_match: {
            id: 'clock_match',
            title: '時計合わせゲーム',
            grade: 2,
            skill: 'clock_reading',
            description: '時計の針を正しい時間に合わせて宝箱を開けよう。',
            targetType: 'time',
            winCondition: { type: 'exactMatch', attempts: 3 },
            difficultySteps: [5, 10, 15],
            assets: { background: 'clock-tower', reward: 'time_shard' }
        },
        coin_count: {
            id: 'coin_count',
            title: '硬貨計算ゲーム',
            grade: 2,
            skill: 'money_counting',
            description: '指定の金額になるように硬貨を集めよう。',
            targetType: 'currency',
            winCondition: { type: 'sumEquals', attempts: 4 },
            difficultySteps: [100, 200, 500],
            assets: { background: 'market', reward: 'coin_bundle' }
        },
        even_odd_sort: {
            id: 'even_odd_sort',
            title: '偶数・奇数の仕分け',
            grade: 2,
            skill: 'even_odd',
            description: '数字カードを偶数と奇数に素早く仕分けよう。',
            targetType: 'parity',
            winCondition: { type: 'classification', streak: 8 },
            difficultySteps: [20, 50, 100],
            assets: { background: 'forest', reward: 'leaf_charm' }
        },
        array_painter: {
            id: 'array_painter',
            title: '九九ロール＆アレイ',
            grade: 3,
            skill: 'multiplication_array',
            description: 'サイコロで行と列をそろえて配列を完成させよう。',
            targetType: 'array',
            winCondition: { type: 'gridFill', streak: 6 },
            difficultySteps: [5, 8, 10],
            assets: { background: 'temple', reward: 'starlight' }
        },
        unit_conversion_lab: {
            id: 'unit_conversion_lab',
            title: '単位換算ラボ',
            grade: 3,
            skill: 'unit_conversion',
            description: '単位を変えて研究装置を完成させよう。',
            targetType: 'conversion',
            winCondition: { type: 'multiStep', attempts: 3 },
            difficultySteps: [10, 100, 1000],
            assets: { background: 'lab', reward: 'converter_chip' }
        },
        story_solver: {
            id: 'story_solver',
            title: '文章題チャレンジ',
            grade: 3,
            skill: 'word_problem',
            description: '短い物語を読んで式を立てよう。',
            targetType: 'scenario',
            winCondition: { type: 'interpretation', attempts: 4 },
            difficultySteps: [1, 2, 3],
            assets: { background: 'safari', reward: 'wisdom_scroll' }
        }
    };

    const storyBeats = [
        { id: 'intro', gradeRange: [2, 3], title: '迷路バトルのはじまり', summary: '魔法の迷宮に眠る知恵のクリスタルを集める旅がスタート。', unlocks: ['forest'] },
        { id: 'forest-harmony', gradeRange: [2], title: '森を照らす光', summary: '森の精霊が時計の歯車をなくし、時間が止まってしまった！', unlocks: ['clock_match'] },
        { id: 'market-festival', gradeRange: [2], title: 'コインフェスティバル', summary: '市場で計算クイズ大会が開催される。優勝して衣装をゲットしよう。', unlocks: ['coin_pouch', 'coin_count'] },
        { id: 'volcano-trial', gradeRange: [3], title: '火山の試練', summary: '火山の守護者が九九の儀式を求めている。', unlocks: ['array_painter'] },
        { id: 'ocean-research', gradeRange: [3], title: '海底研究隊', summary: '単位換算で潜水艦を調整し、深海の宝を見つけよう。', unlocks: ['unit_conversion_lab'] },
        { id: 'finale', gradeRange: [2, 3], title: 'スタースカイの決戦', summary: '星の王マスエンペラーとの最終決戦。協力モードで挑むと特別称号が解放。', unlocks: ['legendary_quill', 'space'] }
    ];

    const companionCatalog = [
        { id: 'pip', name: 'ピピ', type: 'fairy', gradeRange: [2, 3], boosts: { encouragement: 1.2 }, unlockStory: 'intro' },
        { id: 'bolt', name: 'ボルト', type: 'dragon', gradeRange: [3], boosts: { speed: 0.9 }, unlockStory: 'volcano-trial' },
        { id: 'flora', name: 'フローラ', type: 'sprite', gradeRange: [2], boosts: { hintCooldown: 0.8 }, unlockStory: 'forest-harmony' }
    ];

    window.MATH_ADVENTURE_BLUEPRINT = {
        gradeCurriculum,
        themeWorlds,
        badgeCatalog,
        shopInventory,
        aiTutorProfiles,
        miniGameConfigs,
        storyBeats,
        companionCatalog
    };
})();
