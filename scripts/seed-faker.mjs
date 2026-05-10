import { faker } from "@faker-js/faker";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_USER_COUNT = 10;
const TOPICS = [
  "python coding",
  "hyperbola",
  "ellipse",
  "javascript",
  "shakespeare poems",
];

const CARD_BANK = {
  "python coding": [
    {
      question: "What is a Python list comprehension used for?",
      answer:
        "A list comprehension builds a new list from an iterable in one readable expression, often replacing short loop-and-append patterns.",
    },
    {
      question: "Why use a virtual environment in Python projects?",
      answer:
        "It isolates dependencies per project, preventing version conflicts between packages needed by different applications.",
    },
    {
      question: "What does `if __name__ == '__main__':` do?",
      answer:
        "It runs a block only when the file is executed directly, not when the module is imported elsewhere.",
    },
    {
      question: "When should you use a Python dictionary?",
      answer:
        "Use a dictionary when you need fast key-to-value lookups, such as mapping usernames to profile records.",
    },
    {
      question: "How is a tuple different from a list in Python?",
      answer:
        "A tuple is immutable after creation, while a list is mutable and supports in-place updates.",
    },
    {
      question: "What is the purpose of Python's `with` statement?",
      answer:
        "It manages setup and cleanup for resources like files and database connections, even if an exception occurs.",
    },
    {
      question: "Why are Python functions with default mutable arguments risky?",
      answer:
        "The default value is created once, so shared state can leak across function calls unexpectedly.",
    },
    {
      question: "What does `enumerate()` provide in a loop?",
      answer:
        "It yields both index and item, so you can track positions without manually incrementing counters.",
    },
    {
      question: "What does PEP 8 primarily guide?",
      answer:
        "PEP 8 defines style conventions for readable Python code, including naming, formatting, and spacing.",
    },
    {
      question: "When should you catch specific exceptions in Python?",
      answer:
        "Catch specific exceptions to handle expected failures clearly while avoiding suppression of unrelated errors.",
    },
    {
      question: "How does slicing work with `my_list[1:4]`?",
      answer:
        "It returns elements starting at index 1 up to, but not including, index 4.",
    },
    {
      question: "Why use `dataclasses` in Python?",
      answer:
        "Dataclasses reduce boilerplate by auto-generating methods like `__init__` and `__repr__` for data containers.",
    },
  ],
  hyperbola: [
    {
      question: "What is the standard form of a horizontal hyperbola centered at the origin?",
      answer:
        "The standard form is x^2/a^2 - y^2/b^2 = 1, where the transverse axis lies along the x-axis.",
    },
    {
      question: "How are asymptotes related to a hyperbola?",
      answer:
        "Asymptotes are lines the hyperbola approaches at large distances; they guide the branch directions.",
    },
    {
      question: "What geometric property defines a hyperbola?",
      answer:
        "For any point on the curve, the absolute difference of distances to two fixed foci is constant.",
    },
    {
      question: "What does the value of `a` represent in a hyperbola?",
      answer:
        "`a` is the distance from the center to each vertex along the transverse axis.",
    },
    {
      question: "How do you identify whether a hyperbola opens left-right or up-down?",
      answer:
        "In standard form, the positive squared term indicates the opening direction along that axis.",
    },
    {
      question: "What is the relationship between a, b, and c in a hyperbola?",
      answer:
        "They satisfy c^2 = a^2 + b^2, where c is the center-to-focus distance.",
    },
    {
      question: "What is an eccentricity value for a hyperbola?",
      answer:
        "The eccentricity is always greater than 1, reflecting how much the branches spread from the center.",
    },
    {
      question: "How can you sketch a hyperbola quickly from its equation?",
      answer:
        "Mark the center, vertices, and asymptote rectangle, then draw branches approaching asymptotes outward.",
    },
    {
      question: "What are conjugate and transverse axes in a hyperbola?",
      answer:
        "The transverse axis passes through the vertices; the conjugate axis is perpendicular through the center.",
    },
    {
      question: "How do asymptotes look for x^2/9 - y^2/4 = 1?",
      answer:
        "The asymptotes are y = ±(2/3)x, based on slope b/a around the center at the origin.",
    },
    {
      question: "Why do hyperbolas appear in navigation and signal systems?",
      answer:
        "Difference-in-distance constraints naturally model timing-based location methods, producing hyperbolic curves.",
    },
    {
      question: "How do translations affect hyperbola equations?",
      answer:
        "Replacing x and y with (x-h) and (y-k) shifts the center to (h, k) without changing overall shape.",
    },
  ],
  ellipse: [
    {
      question: "What is the standard form of an ellipse centered at the origin?",
      answer:
        "It is x^2/a^2 + y^2/b^2 = 1, with the larger denominator aligned with the major axis.",
    },
    {
      question: "How is an ellipse geometrically defined?",
      answer:
        "The sum of distances from any point on the ellipse to two foci remains constant.",
    },
    {
      question: "What does the semi-major axis represent?",
      answer:
        "It is half the longest diameter of the ellipse and controls its longest radius.",
    },
    {
      question: "How do you determine if the major axis is horizontal or vertical?",
      answer:
        "The larger denominator under x^2 or y^2 indicates the axis direction of greater spread.",
    },
    {
      question: "What relation connects a, b, and c in an ellipse?",
      answer:
        "For an ellipse, c^2 = a^2 - b^2 where c is center-to-focus distance and a >= b.",
    },
    {
      question: "What is the eccentricity range of an ellipse?",
      answer:
        "Ellipse eccentricity satisfies 0 <= e < 1, with smaller values closer to a circle.",
    },
    {
      question: "How do you find ellipse vertices from standard form?",
      answer:
        "Move from the center by ±a along the major axis to get the two vertices.",
    },
    {
      question: "Why is a circle a special ellipse case?",
      answer:
        "When a equals b, both axes are equal, and the ellipse becomes a circle centered at the same point.",
    },
    {
      question: "How can you model planetary orbits with ellipses?",
      answer:
        "Kepler's first law states planets travel in elliptical orbits with the sun at one focus.",
    },
    {
      question: "How does shifting an ellipse center affect its equation?",
      answer:
        "Using (x-h)^2 and (y-k)^2 translates the center to (h, k) while preserving axis lengths.",
    },
    {
      question: "What role do foci play in reflection properties of ellipses?",
      answer:
        "A ray from one focus reflects to the other, which is useful in acoustics and optics.",
    },
    {
      question: "How do you graph x^2/16 + y^2/9 = 1?",
      answer:
        "The center is the origin, major axis is horizontal with vertices at (±4, 0), and co-vertices at (0, ±3).",
    },
  ],
  javascript: [
    {
      question: "What is the difference between `let` and `var` in JavaScript?",
      answer:
        "`let` is block-scoped while `var` is function-scoped and hoisted with `undefined` initialization.",
    },
    {
      question: "Why use `const` for objects if objects can still change?",
      answer:
        "`const` prevents reassignment of the binding, but object properties remain mutable unless explicitly frozen.",
    },
    {
      question: "What does the event loop do in JavaScript?",
      answer:
        "It coordinates execution of synchronous code, microtasks, and queued callbacks in a single-threaded runtime.",
    },
    {
      question: "How does `===` differ from `==`?",
      answer:
        "`===` checks strict equality without coercion, while `==` may convert types before comparison.",
    },
    {
      question: "What are closures in JavaScript?",
      answer:
        "A closure is a function retaining access to variables from its lexical scope after the outer function returns.",
    },
    {
      question: "When should you use `async/await`?",
      answer:
        "Use `async/await` to express promise-based asynchronous flows in readable, linear control structures.",
    },
    {
      question: "What does optional chaining (`?.`) prevent?",
      answer:
        "It avoids runtime errors by returning `undefined` when an intermediate object is nullish.",
    },
    {
      question: "Why is immutability useful in React state updates?",
      answer:
        "Creating new objects helps React detect changes efficiently and avoids subtle mutation bugs.",
    },
    {
      question: "What is a pure function in JavaScript?",
      answer:
        "A pure function returns the same output for the same input and has no side effects.",
    },
    {
      question: "How does destructuring improve code clarity?",
      answer:
        "It extracts values from arrays or objects with concise syntax and can document expected structure.",
    },
    {
      question: "What is the purpose of `Array.prototype.map`?",
      answer:
        "It transforms each array element and returns a new array without mutating the original.",
    },
    {
      question: "Why do modules matter in JavaScript projects?",
      answer:
        "Modules encapsulate functionality, improve reuse, and enable better dependency management and tooling.",
    },
  ],
  "shakespeare poems": [
    {
      question: "What is the structure of a Shakespearean sonnet?",
      answer:
        "It has 14 lines in iambic pentameter with three quatrains followed by a concluding couplet.",
    },
    {
      question: "What rhyme scheme is common in Shakespeare's sonnets?",
      answer: "The typical scheme is ABAB CDCD EFEF GG.",
    },
    {
      question: "What is iambic pentameter?",
      answer:
        "It is a meter with five iambs per line, often heard as an unstressed-stressed beat pattern.",
    },
    {
      question: "What is the 'volta' in sonnet analysis?",
      answer:
        "The volta is the thematic turn, often near line 9 or before the final couplet in Shakespearean form.",
    },
    {
      question: "How does Sonnet 18 begin, and why is it famous?",
      answer:
        "It opens with 'Shall I compare thee to a summer's day?' and explores poetry's power to preserve beauty.",
    },
    {
      question: "Why is the final couplet important in many Shakespeare sonnets?",
      answer:
        "It often delivers a sharp resolution, paradox, or emotional insight that reframes earlier lines.",
    },
    {
      question: "What theme appears repeatedly in Shakespeare's sonnets?",
      answer:
        "Recurring themes include time, mortality, beauty, betrayal, and the enduring force of verse.",
    },
    {
      question: "How does metaphor function in Shakespeare's poetry?",
      answer:
        "Metaphors compress complex emotion into vivid images, making abstract ideas concrete and memorable.",
    },
    {
      question: "What makes Sonnet 130 notable?",
      answer:
        "It subverts idealized love-poem conventions by describing the beloved with realistic, anti-Petrarchan imagery.",
    },
    {
      question: "How can students read Shakespearean diction more effectively?",
      answer:
        "Read aloud, paraphrase line by line, and track imagery and syntax before jumping to interpretation.",
    },
    {
      question: "Why does Shakespeare use sound devices like alliteration?",
      answer:
        "Sound patterns emphasize mood and meaning, helping key phrases linger in the listener's ear.",
    },
    {
      question: "How does time act as an adversary in the sonnets?",
      answer:
        "Time threatens beauty and life, while poetry is presented as a strategy for resistance and remembrance.",
    },
  ],
};

function buildDeckTitle(topic) {
  const labels = {
    "python coding": ["Python Essentials", "Practical Python Patterns"],
    hyperbola: ["Hyperbola Fundamentals", "Hyperbola Problem Solving"],
    ellipse: ["Ellipse Essentials", "Ellipse Applications"],
    javascript: ["Modern JavaScript Core", "JavaScript in Practice"],
    "shakespeare poems": ["Shakespeare Sonnet Study", "Poetry and Language in Shakespeare"],
  };
  return faker.helpers.arrayElement(labels[topic]);
}

function buildDeckDescription(topic) {
  const descriptions = {
    "python coding":
      "Hands-on flashcards for Python syntax, data structures, and readable coding habits.",
    hyperbola:
      "Conic section review focused on geometric definitions, asymptotes, and equation interpretation.",
    ellipse:
      "Concept checks covering ellipse equations, foci, eccentricity, and real-world applications.",
    javascript:
      "A focused deck on core JavaScript concepts used in modern web development.",
    "shakespeare poems":
      "Study prompts on sonnet form, poetic devices, and recurring Shakespearean themes.",
  };
  return descriptions[topic];
}

function makeUsers(userCount) {
  faker.seed(20260427);

  return Array.from({ length: userCount }, (_, index) => {
    const first = faker.person.firstName();
    const last = faker.person.lastName();
    return {
      email: `${first}.${last}.${index + 1}@example.edu`.toLowerCase(),
      username: `${first}${last}${index + 1}`.toLowerCase(),
      profile: {
        full_name: `${first} ${last}`,
        bio: `Learner ${index + 1} focused on coding, mathematics, and literature practice.`,
      },
    };
  });
}

function pickCards(topic, minCards, maxCards) {
  return faker.helpers.arrayElements(
    CARD_BANK[topic],
    faker.number.int({ min: minCards, max: maxCards }),
  );
}

async function run() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dryRun = process.argv.includes("--dry-run");

  const profilesTable = process.env.SEED_PROFILES_TABLE || "profile";
  const decksTable = process.env.SEED_DECKS_TABLE || "deck";
  const cardsTable = process.env.SEED_CARDS_TABLE || "card";

  const userCount = DEFAULT_USER_COUNT;
  const users = makeUsers(userCount);

  if (dryRun || !supabaseUrl || !supabaseServiceRoleKey) {
    const preview = users.map((user) => {
      const deckCount = faker.number.int({ min: 1, max: 2 });
      const decks = Array.from({ length: deckCount }, () => {
        const topic = faker.helpers.arrayElement(TOPICS);
        const selectedCards = pickCards(topic, 8, 12);
        return {
          topic,
          title: buildDeckTitle(topic),
          description: buildDeckDescription(topic),
          cards: selectedCards,
        };
      });

      return {
        ...user,
        decks,
      };
    });

    console.log(
      JSON.stringify(
        {
          mode: "dry-run",
          message:
            "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to insert into Supabase. Table names can be overridden with SEED_PROFILES_TABLE, SEED_DECKS_TABLE, and SEED_CARDS_TABLE env vars.",
          users: preview,
        },
        null,
        2,
      ),
    );
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const user of users) {
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: faker.internet.password({ length: 16 }),
      email_confirm: true,
      user_metadata: { username: user.username },
    });

    if (authError || !authUser?.user?.id) {
      throw new Error(
        `Failed to create auth user ${user.email}: ${authError?.message || "Unknown error"}`,
      );
    }

    const userId = authUser.user.id;

    const { data: createdProfile, error: profileError } = await supabase
      .from(profilesTable)
      .insert({
        user_id: userId,
        email: user.email,
      })
      .select("id")
      .single();

    if (profileError) {
      throw new Error(
        `Failed to insert profile for user ${user.email}: ${profileError.message}`,
      );
    }
    const profileId = createdProfile.id;

    const deckCount = faker.number.int({ min: 1, max: 2 });
    for (let i = 0; i < deckCount; i += 1) {
      const topic = faker.helpers.arrayElement(TOPICS);
      const { data: createdDeck, error: deckError } = await supabase
        .from(decksTable)
        .insert({
          profile_id: profileId,
          title: `${buildDeckTitle(topic)}: ${topic}`,
          is_public: faker.datatype.boolean(),
        })
        .select("id")
        .single();

      if (deckError) {
        throw new Error(`Failed to insert deck for ${user.email}: ${deckError.message}`);
      }

      const deckId = createdDeck.id;
      const cards = pickCards(topic, 8, 12).map((card, index) => ({
        deck_id: deckId,
        front_question: card.question,
        back_answer: card.answer,
        order: index + 1,
      }));

      const { error: cardsError } = await supabase.from(cardsTable).insert(cards);
      if (cardsError) {
        throw new Error(
          `Failed to insert cards for deck ${deckId} (${user.email}): ${cardsError.message}`,
        );
      }
    }
  }

  console.log(
    `Seed complete: ${userCount} users, 1 profile per user, 1-2 decks per user, 8-12 cards per deck.`,
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
