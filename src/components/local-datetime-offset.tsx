"use client";

import { useEffect, useState } from "react";

export function LocalDateTimeOffset() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    setOffset(new Date().getTimezoneOffset());
  }, []);
  return <input type="hidden" name="timezoneOffset" value={offset} />;
}
