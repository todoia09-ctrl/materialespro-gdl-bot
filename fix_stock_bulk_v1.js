/**
 * fix_stock_bulk_v1.js
 * MaterialesPro GDL — Carga stock_physical para 818 productos desde xlsx
 * 
 * EJECUTAR: node fix_stock_bulk_v1.js
 * REQUIERE: .env con SUPABASE_URL y SUPABASE_SERVICE_KEY
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const STOCK_DATA = [
  {
    "codigo": "CREST-0036",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0035",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0037",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0038",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0039",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0029",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0001",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0015",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0034",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0019",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0020",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0021",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0022",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0023",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0040",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0041",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0051",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0052",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0042",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0024",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0032",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0033",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0009",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0010",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0011",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0025",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0012",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0026",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0046",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0047",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0002",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0003",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0007",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0008",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0005",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0013",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0014",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0004",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0017",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0018",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0043",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0044",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0045",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0050",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0016",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0027",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0028",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0006",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0053",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0054",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0055",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0056",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0030",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0031",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0048",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "CREST-0049",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-082",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-104",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-102",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-103",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-028",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-020",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-029",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-021",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-022",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-030",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-024",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-031",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-023",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-025",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-027",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-026",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-041",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-033",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-032",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-018",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-019",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-016",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-017",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-001",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-002",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-003",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-004",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-006",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-005",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-008",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-007",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-009",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-010",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-011",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-014",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-012",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-013",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-015",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-039",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-038",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-040",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-193",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-194",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-036",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-037",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-142",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-140",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-141",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-179",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-180",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-181",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-199",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-196",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-195",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-175",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-176",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-178",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-177",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-035",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-034",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-156",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-158",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-157",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-160",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-161",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-159",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-162",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-163",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-165",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-164",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-106",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-109",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-107",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-108",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-105",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-111",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-110",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-171",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-172",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-173",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-174",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-117",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-118",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-116",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-100",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-185",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-182",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-190",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-191",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-192",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-144",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-143",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-147",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-146",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-125",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-126",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-128",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-127",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-148",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-149",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-183",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-186",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-207",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-150",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-112",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-170",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-169",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-098",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-209",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-208",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-212",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-210",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-211",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-057",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-058",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-056",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-044",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-043",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-045",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-046",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-048",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-047",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-050",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-049",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-052",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-053",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-051",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-054",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-055",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-059",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-061",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-060",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-080",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-114",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-113",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-115",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-062",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-064",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-063",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-067",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-066",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-065",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-068",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-069",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-198",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-076",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-075",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-077",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-074",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-099",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-042",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-204",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-200",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-203",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-205",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-206",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-202",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-201",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-197",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-070",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-072",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-071",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-073",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-083",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-084",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-085",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-138",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-137",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-139",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-136",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-081",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-078",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-079",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-155",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-154",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-153",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-152",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-151",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-188",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-187",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-189",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-093",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-094",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-095",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-096",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-097",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-089",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-090",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-092",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-091",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-086",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-087",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-088",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-101",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-168",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-167",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-166",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-145",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-134",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-135",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-130",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-132",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-133",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-129",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-131",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-119",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-120",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-121",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-122",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-124",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-123",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-184",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-215",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-213",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "FESTER-214",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0167",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0168",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0162",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0105",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0036",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0028",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0064",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0027",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0011",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0012",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0125",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0063",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0029",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0103",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0013",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0026",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0145",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0121",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0122",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0123",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0120",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0124",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0155",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0153",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0154",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0156",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0157",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0159",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0158",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0149",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0102",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0015",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0016",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0148",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0146",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0038",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0037",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0046",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0043",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0047",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0045",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0126",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0128",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0127",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0151",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0150",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0152",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0052",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0161",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0164",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0165",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0166",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0163",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0040",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0039",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0112",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0113",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0108",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0110",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0109",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0111",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0100",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0115",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0114",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0117",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0116",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0106",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0107",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0139",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0034",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0035",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0032",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0033",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0129",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0137",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0131",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0171",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0048",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0049",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0119",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0101",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0058",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0059",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0061",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0060",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0099",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0051",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0044",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0160",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0005",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0009",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0010",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0170",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0014",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0019",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0020",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0003",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0004",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0074",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0075",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0076",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0073",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0006",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0002",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0008",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0017",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0025",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0098",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0097",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0096",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0001",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0007",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0066",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0068",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0065",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0067",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0070",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0071",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0069",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0072",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0138",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0133",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0142",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0134",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0140",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0143",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0144",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0118",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0147",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0132",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0136",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0130",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0141",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0135",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0169",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0023",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0024",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0062",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0080",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0078",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0079",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0083",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0082",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0081",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0091",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0090",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0092",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0093",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0095",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0094",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0057",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0056",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0041",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0042",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0018",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0077",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0055",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0053",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0054",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0050",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0104",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0086",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0084",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0085",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0087",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0088",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0089",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0021",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PEG-0022",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-16AP-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0052-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0053-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0326-PZ01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0327-LT04",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0324-LT00",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0325-LT01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0247-SA25",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-1080-0418-CU18",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-1080-0417-GL01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2080-0460-LT04",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0246-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-007",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0274-LT01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0276-CU19",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0279-L200",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0275-LT04",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2080-0433-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-009",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-011",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-027",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-028",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-030",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-025",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2080-0441-CU19",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-010",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-029",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-024",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-031",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-026",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-003",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-001",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-002",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-012",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-013",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-014",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-015",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-016",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-017",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-018",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-019",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-020",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-021",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-022",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-023",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0241-SA25",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0075-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0071-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0072-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0077-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0101-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0079-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0050-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0088-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0089-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0080-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0081-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-1613-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0055-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0120-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0121-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0057-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0056-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0058-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0059-SA10",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0094-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0060-SA10",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0095-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-1639-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-1635-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0064-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0065-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-1633-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-1615-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-1651-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-1652-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0314-LT01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0313-CU19",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0315-LT04",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0317-LT00",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0318-LT01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0321-LT01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0322-LT04",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0323-LT18",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0319-LT04",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0320-LT18",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0285-PZ01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2120-0286-PZ01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-16BM-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-008",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-16NW-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2040-18BL-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-005",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-006",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-VAR-004",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0084-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2010-0085-SA20",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "PER-2100-0028-PZ01",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-679086",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-679082",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-679066",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-678587",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-495772",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-432433",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-432434",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-432436",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-432435",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-418248",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-710609",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-418251",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-710608",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-675278",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-675277",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-567385",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-567384",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-567371",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-616195",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-565199",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-616353",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-616354",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-589438",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-616355",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-498387",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-433514",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-430344",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97210",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-526409",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-503650",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97189",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97034",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-610486",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-608454",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-598672",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-598546",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-408872",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-422041",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96683",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-409168",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-565785",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-565789",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-536341",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-536014",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97211",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-571719",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-648991",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96691",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-609103",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-609098",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96645",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-423836",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96692",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-428417",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-498317",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-584940",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-497962",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-616778",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-793752",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-792489",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-60087",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-433515",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-430357",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-161970",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-433513",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-424234",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-555880",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-554324",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-439088",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-439089",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-542384",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-540008",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97032",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-809480",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-809469",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97135",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97029",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-437325",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-437326",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-546757",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-409935",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-636036",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-661715",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-433510",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-445819",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-473149",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-473159",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-579406",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-473161",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-473171",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-423839",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-565830",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-596963",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-104000",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-178827",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-437428",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-437427",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-632871",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-437595",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-717135",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-717136",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-717137",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-493146",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-493145",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-503414",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-503415",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-503416",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-476098",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-529788",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-469477",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-536265",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-640869",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-818467",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-818447",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-91478",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-451874",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-496564",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-521344",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-536966",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-501420",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-501424",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-495409",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-495422",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-508885",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-502089",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-502112",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-450262",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-816224",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-816101",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-624690",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-422496",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-563728",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-506463",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-562732",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-735962",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-95759",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-453579",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-535259",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-90942",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-174730",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-780035",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-609569",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-402549",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-750748",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-750823",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-750846",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-750708",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-750845",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-753065",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-678024",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-507611",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-507609",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-188215",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-809889",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-809888",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-802427",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-802463",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-459999",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-439220",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97047",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97048",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-444116",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-698806",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-698807",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-444355",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-603880",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-603883",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-743158",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-446026",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-183042",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-105317",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-796589",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-451875",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-796641",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96894",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96920",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97105",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-641419",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97107",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-440637",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-427349",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-427480",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-423835",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-442026",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-406314",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-556285",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-464600",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-713011",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-713010",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-570527",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-437562",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-428850",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-446212",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-672156",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-617670",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96657",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-433470",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-422042",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96680",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-188051",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-515280",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-458087",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96653",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96654",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96652",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97112",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-484103",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-425016",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-175179",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96682",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-816223",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-519392",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97861",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97864",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97863",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97862",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-661487",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-550937",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-529447",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-529446",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96618",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-423838",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739937",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-740010",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739987",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739954",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739971",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739961",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739980",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739754",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739675",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-740021",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739923",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739968",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739906",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739986",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739972",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739965",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-740003",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739905",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739904",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739755",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739674",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739989",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-740012",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739969",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-740011",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739967",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739995",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739970",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739952",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739953",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739884",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-739913",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-508899",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-94803",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-609139",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-162600",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-438770",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-438769",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-438772",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-412171",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-169788",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-623891",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-96690",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-426005",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-426004",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97834",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97837",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-410390",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-471193",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-97094",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-512824",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-410393",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-447643",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-447762",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-816238",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-60081",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-530729",
    "stock": 50,
    "stock_minimo": 5
  },
  {
    "codigo": "SIKA-530728",
    "stock": 50,
    "stock_minimo": 5
  }
];

async function run() {
  console.log("\n[FIX STOCK BULK] " + STOCK_DATA.length + " productos\n");
  let ok = 0, fail = 0, notFound = 0;

  for (const item of STOCK_DATA) {
    const { data: cat, error: catErr } = await supabase
      .from("catalogo_productos")
      .select("id")
      .eq("sku", item.codigo)
      .single();

    if (catErr || !cat) {
      notFound++;
      continue;
    }

    const { error: invErr } = await supabase
      .from("inventario")
      .update({
        stock_physical: item.stock,
        actualizado_en: new Date().toISOString(),
        actualizado_por: "fix_stock_bulk_v1"
      })
      .eq("catalogo_id", cat.id);

    if (invErr) { fail++; continue; }

    await supabase
      .from("catalogo_productos")
      .update({ cantidad_minima: item.stock_minimo })
      .eq("id", cat.id);

    ok++;
    if (ok % 100 === 0) console.log("  -> " + ok + "/" + STOCK_DATA.length);
  }

  console.log("\n=== RESULTADO ===");
  console.log("OK:        " + ok);
  console.log("NOT FOUND: " + notFound);
  console.log("ERRORS:    " + fail);
}

run().catch(console.error);
