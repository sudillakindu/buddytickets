import argparse
import json
import pathlib
import re
import sys
from dataclasses import dataclass


ROOT = pathlib.Path(__file__).resolve().parents[1]
SQL_PATH = ROOT / "supabase/migrations/20260223191944_initial_schema.sql"
ACTIONS_DIR = ROOT / "src/lib/actions"
TYPES_DIR = ROOT / "src/lib/types"


FILE_TABLE_MAP = {
    "auth.ts": {"users", "otp_records", "auth_flow_tokens"},
    "event.ts": {"events", "categories", "event_images", "ticket_types"},
    "profile.ts": {"users"},
    "ticket.ts": {"tickets", "ticket_types", "events", "event_images"},
}


ALLOWED_NON_DB_TYPE_KEYS = {
    "success",
    "message",
    "token",
    "redirectTo",
    "needsVerification",
    "attemptsRemaining",
    "resetToken",
    "purpose",
    "remainingSeconds",
    "canResend",
    "data",
    "profile",
    "imageUrl",
    "primary_image",
    "category",
    "start_ticket_price",
    "images",
    "ticket_types",
    "ticket_type",
    "event",
}


@dataclass
class Metrics:
    total: int
    matched: int

    @property
    def percentage(self) -> float:
        if self.total == 0:
            return 100.0
        return round((self.matched / self.total) * 100, 2)


def parse_table_columns(sql_text: str) -> dict[str, set[str]]:
    table_re = re.compile(
        r"CREATE TABLE IF NOT EXISTS\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\);",
        re.S,
    )
    col_re = re.compile(r"^\s*([a-z_][a-z0-9_]*)\s+", re.I)

    table_cols: dict[str, set[str]] = {}
    for table_name, body in table_re.findall(sql_text):
        cols: set[str] = set()
        for line in body.splitlines():
            s = line.strip()
            if not s or s.startswith("--"):
                continue
            if s.upper().startswith(("CONSTRAINT", "PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "CHECK")):
                continue
            m = col_re.match(line)
            if m:
                cols.add(m.group(1))
        table_cols[table_name] = cols
    return table_cols


def extract_action_db_fields(ts_text: str) -> set[str]:
    fields = set()

    for m in re.finditer(r"\.select\((`|'|\")([\s\S]*?)\1\)", ts_text):
        query = m.group(2)
        fields.update(re.findall(r"\b[a-z]+(?:_[a-z0-9]+)+\b", query))

    for m in re.finditer(r"\.(?:eq|neq|gt|gte|lt|lte|order|not|in)\('([a-z_]+)'", ts_text):
        fields.add(m.group(1))

    for m in re.finditer(r"\.(?:insert|update)\(\{([\s\S]*?)\}\)", ts_text):
        obj = m.group(1)
        fields.update(re.findall(r"\b([a-z]+(?:_[a-z0-9]+)+)\s*:", obj))

    return fields


def extract_type_keys(ts_text: str) -> set[str]:
    return set(re.findall(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*", ts_text, re.M))


def compute_metrics(items: set[str], db_cols: set[str]) -> tuple[Metrics, list[str]]:
    matched = items & db_cols
    unmatched = sorted(items - db_cols)
    return Metrics(total=len(items), matched=len(matched)), unmatched


def split_db_comparable(items: set[str], db_cols: set[str], extra_non_db: set[str] | None = None) -> tuple[set[str], set[str]]:
    non_db = set(extra_non_db or set())
    comparable = set()
    excluded = set()

    for item in items:
        if item in db_cols:
            comparable.add(item)
            continue
        if item in non_db:
            excluded.add(item)
            continue
        excluded.add(item)

    return comparable, excluded


def main() -> None:
    parser = argparse.ArgumentParser(description="Audit schema alignment between app attributes and DB columns.")
    parser.add_argument(
        "--fail-under",
        type=float,
        default=None,
        help="Exit with code 1 if overall db_only percentage is below this value.",
    )
    args = parser.parse_args()

    sql_text = SQL_PATH.read_text(encoding="utf-8")
    table_cols = parse_table_columns(sql_text)

    results: dict[str, object] = {
        "actions": {},
        "types": {},
        "overall": {},
    }

    action_schema_total = 0
    action_schema_matched = 0

    for path in sorted(ACTIONS_DIR.glob("*.ts")):
        file_name = path.name
        expected_tables = FILE_TABLE_MAP.get(file_name, set())
        db_cols = set().union(*(table_cols.get(t, set()) for t in expected_tables))

        action_fields = extract_action_db_fields(path.read_text(encoding="utf-8"))
        action_fields = action_fields - expected_tables
        comparable, excluded = split_db_comparable(action_fields, db_cols)
        schema_metrics, schema_unmatched = compute_metrics(comparable, db_cols)

        action_schema_total += schema_metrics.total
        action_schema_matched += schema_metrics.matched

        results["actions"][file_name] = {
            "db_only": {
                "total": schema_metrics.total,
                "matched": schema_metrics.matched,
                "percentage": schema_metrics.percentage,
                "unmatched": schema_unmatched,
                "excluded_non_db": sorted(excluded),
            }
        }

    type_schema_total = 0
    type_schema_matched = 0

    for path in sorted(TYPES_DIR.glob("*.ts")):
        file_name = path.name
        expected_tables = FILE_TABLE_MAP.get(file_name, set())
        db_cols = set().union(*(table_cols.get(t, set()) for t in expected_tables))

        keys = extract_type_keys(path.read_text(encoding="utf-8"))

        comparable, excluded = split_db_comparable(keys, db_cols, ALLOWED_NON_DB_TYPE_KEYS)
        schema_metrics, schema_unmatched = compute_metrics(comparable, db_cols)

        type_schema_total += schema_metrics.total
        type_schema_matched += schema_metrics.matched

        results["types"][file_name] = {
            "db_only": {
                "total": schema_metrics.total,
                "matched": schema_metrics.matched,
                "percentage": schema_metrics.percentage,
                "unmatched": schema_unmatched,
                "excluded_non_db": sorted(excluded),
            },
        }

    db_total = action_schema_total + type_schema_total
    db_matched = action_schema_matched + type_schema_matched
    db_overall = Metrics(db_total, db_matched)

    results["overall"] = {
        "db_only": {
            "total": db_overall.total,
            "matched": db_overall.matched,
            "percentage": db_overall.percentage,
        },
    }

    print(json.dumps(results, indent=2))

    if args.fail_under is not None and db_overall.percentage < args.fail_under:
        print(
            (
                f"Schema alignment check failed: db_only percentage {db_overall.percentage}% "
                f"is below threshold {args.fail_under}%."
            ),
            file=sys.stderr,
        )
        raise SystemExit(1)


if __name__ == "__main__":
    main()
