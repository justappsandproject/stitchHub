/// Parses API values that may arrive as [num], [String], or null (e.g. Prisma Decimal).
double? parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

double parseDoubleOrZero(dynamic value) => parseDouble(value) ?? 0;

int? parseInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

int parseIntOrZero(dynamic value) => parseInt(value) ?? 0;

num parseNumOrZero(dynamic value) => parseDouble(value) ?? parseInt(value) ?? 0;
