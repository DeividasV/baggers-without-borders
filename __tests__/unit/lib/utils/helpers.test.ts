import {
  transliterate,
  debounce,
  isAdmin,
  generateId,
} from "@/src/lib/utils/helpers";

describe("transliterate", () => {
  describe("Basic functionality", () => {
    it("should return empty string for empty input", () => {
      expect(transliterate("")).toBe("");
      expect(transliterate(null as any)).toBe("");
      expect(transliterate(undefined as any)).toBe("");
    });

    it("should preserve ASCII alphanumeric characters", () => {
      expect(transliterate("john123")).toBe("john123");
      expect(transliterate("JOHN123")).toBe("john123");
    });

    it("should remove spaces and special characters", () => {
      expect(transliterate("John Doe")).toBe("johndoe");
      expect(transliterate("test@email.com")).toBe("testemailcom");
      expect(transliterate("hello-world_123")).toBe("helloworld123");
    });
  });

  describe("German characters", () => {
    it("should transliterate ß to ss", () => {
      expect(transliterate("Straße")).toBe("strasse");
      expect(transliterate("Müßiggang")).toBe("mussiggang");
    });

    it("should transliterate umlauts", () => {
      expect(transliterate("Müller")).toBe("muller");
      expect(transliterate("Öffentlich")).toBe("offentlich");
      expect(transliterate("Bär")).toBe("bar");
    });
  });

  describe("Nordic characters", () => {
    it("should transliterate Norwegian/Danish/Swedish", () => {
      expect(transliterate("Åse")).toBe("ase");
      expect(transliterate("Bjørn")).toBe("bjorn");
      expect(transliterate("Pær")).toBe("paer");
    });

    it("should transliterate Icelandic", () => {
      expect(transliterate("Þór")).toBe("thor");
      expect(transliterate("Eiður")).toBe("eidur");
    });
  });

  describe("Slavic characters", () => {
    it("should transliterate Czech", () => {
      expect(transliterate("Řehoř")).toBe("rehor");
      expect(transliterate("Čapek")).toBe("capek");
      expect(transliterate("Dvořák")).toBe("dvorak");
    });

    it("should transliterate Polish", () => {
      expect(transliterate("Łukasz")).toBe("lukasz");
      expect(transliterate("Wałęsa")).toBe("walesa");
      expect(transliterate("Zażółć")).toBe("zazolc");
    });

    it("should transliterate Croatian/Serbian", () => {
      expect(transliterate("Đoković")).toBe("dokovic");
      expect(transliterate("Čović")).toBe("covic");
    });
  });

  describe("Baltic characters", () => {
    it("should transliterate Lithuanian", () => {
      expect(transliterate("Vytautas")).toBe("vytautas");
      expect(transliterate("Kęstutis")).toBe("kestutis");
      expect(transliterate("Šiauliai")).toBe("siauliai");
    });

    it("should transliterate Latvian", () => {
      expect(transliterate("Āris")).toBe("aris");
      expect(transliterate("Ģirts")).toBe("girts");
      expect(transliterate("Ķīpsala")).toBe("kipsala");
    });
  });

  describe("Romance languages", () => {
    it("should transliterate French", () => {
      expect(transliterate("François")).toBe("francois");
      expect(transliterate("Cœur")).toBe("coeur");
    });

    it("should transliterate Spanish", () => {
      expect(transliterate("Señor")).toBe("senor");
      expect(transliterate("Peña")).toBe("pena");
    });

    it("should transliterate Portuguese", () => {
      expect(transliterate("João")).toBe("joao");
      expect(transliterate("Conceição")).toBe("conceicao");
    });

    it("should transliterate Romanian", () => {
      expect(transliterate("Țară")).toBe("tara");
      expect(transliterate("Ștefan")).toBe("stefan");
    });
  });

  describe("Other European languages", () => {
    it("should transliterate Hungarian", () => {
      expect(transliterate("Győző")).toBe("gyozo");
      expect(transliterate("Erdős")).toBe("erdos");
    });

    it("should transliterate Turkish", () => {
      expect(transliterate("Çağlar")).toBe("caglar");
      expect(transliterate("Şişli")).toBe("sisli");
    });
  });

  describe("Complex cases", () => {
    it("should handle mixed-language names", () => {
      expect(transliterate("Jean-François Müller")).toBe("jeanfrancoismuller");
      expect(transliterate("Björn Łukasz")).toBe("bjornlukasz");
    });

    it("should handle names with accents (NFD normalization)", () => {
      expect(transliterate("José María")).toBe("josemaria");
      expect(transliterate("François René")).toBe("francoisrene");
    });

    it("should produce username-safe output", () => {
      const result = transliterate("Åse Müller-Øvergård");
      expect(result).toMatch(/^[a-z0-9]+$/);
      expect(result).toBe("asemullerovergard");
    });
  });

  describe("Username generation scenarios", () => {
    it("should work for typical European names", () => {
      expect(transliterate("Włodzimierz")).toBe("wlodzimierz");
      expect(transliterate("Siobhán")).toBe("siobhan");
      expect(transliterate("Bjørk")).toBe("bjork");
      expect(transliterate("Zürich")).toBe("zurich");
    });

    it("should handle edge cases", () => {
      expect(transliterate("123")).toBe("123");
      expect(transliterate("!@#$%")).toBe("");
      expect(transliterate("Test123!")).toBe("test123");
    });
  });
});

describe("isAdmin", () => {
  it("should return true for ADMIN role", () => {
    expect(isAdmin("ADMIN")).toBe(true);
  });

  it("should return false for non-ADMIN roles", () => {
    expect(isAdmin("USER")).toBe(false);
    expect(isAdmin("MODERATOR")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin("")).toBe(false);
  });
});

describe("generateId", () => {
  it("should generate a string ID", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("should generate unique IDs", () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it("should generate hex string", () => {
    const id = generateId();
    expect(id).toMatch(/^[0-9a-f]+$/);
  });
});

describe("debounce", () => {
  jest.useFakeTimers();

  afterEach(() => {
    jest.clearAllTimers();
  });

  it("should delay function execution", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    expect(mockFn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should cancel previous calls", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(300);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments correctly", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn("test", 123);
    jest.advanceTimersByTime(300);

    expect(mockFn).toHaveBeenCalledWith("test", 123);
  });

  it("should support cancel method for cleanup", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn();
    debouncedFn.cancel();

    jest.advanceTimersByTime(300);
    expect(mockFn).not.toHaveBeenCalled();
  });

  it("should allow multiple cancel calls safely", () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 300);

    debouncedFn.cancel();
    debouncedFn.cancel();

    expect(mockFn).not.toHaveBeenCalled();
  });
});
