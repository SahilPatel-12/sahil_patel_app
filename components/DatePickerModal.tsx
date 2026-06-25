import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");

// Design system colors matching the app's brand
const A = {
  bg:       "#ffffff",
  bgSoft:   "#f8fafc",
  orange:   "#ea580c",
  orangeL:  "#f97316",
  orangeBg: "#fff7ed",
  orangeB2: "#ffedd5",
  text:     "#0f172a",
  textM:    "#1e293b",
  textS:    "#64748b",
  textXs:   "#94a3b8",
  bdr:      "#f1f5f9",
  bdr2:     "#e2e8f0",
  green:    "#388e3c",
};

interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateString: string) => void;
  selectedValue: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DatePickerModal({
  visible,
  onClose,
  onSelectDate,
  selectedValue,
}: DatePickerModalProps) {
  const { t } = useLanguage();

  // Parse initial state date or default to today
  const getInitialDate = () => {
    if (selectedValue) {
      const parts = selectedValue.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const parsed = new Date(y, m, d);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    if (visible) {
      setCurrentDate(getInitialDate());
    }
  }, [visible, selectedValue]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar calculations
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Generate calendar grid array
  const gridCells: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) {
    gridCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    gridCells.push(i);
  }

  // Today for comparison (ignoring time)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const formattedDate = `${year}-${mm}-${dd}`;
    onSelectDate(formattedDate);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.card}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity onPress={handlePrevMonth} style={s.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color={A.orange} />
            </TouchableOpacity>
            
            <Text style={s.headerTitle}>
              {t(MONTH_NAMES[month])} {year}
            </Text>

            <TouchableOpacity onPress={handleNextMonth} style={s.navBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={20} color={A.orange} />
            </TouchableOpacity>
          </View>

          {/* Weekdays */}
          <View style={s.weekdaysRow}>
            {WEEKDAYS.map((day, idx) => (
              <Text key={idx} style={s.weekdayText}>
                {t(day)}
              </Text>
            ))}
          </View>

          {/* Days Grid */}
          <View style={s.grid}>
            {gridCells.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={s.dayCellEmpty} />;
              }

              const cellDate = new Date(year, month, day);
              cellDate.setHours(0, 0, 0, 0);
              const isPast = cellDate < today;

              const formattedCell = `${year}-${String(month + 1).padStart(
                2,
                "0"
              )}-${String(day).padStart(2, "0")}`;
              const isSelected = selectedValue === formattedCell;
              const isToday = today.getTime() === cellDate.getTime();

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    s.dayCell,
                    isSelected && s.dayCellSelected,
                    isToday && !isSelected && s.dayCellToday,
                    isPast && s.dayCellDisabled,
                  ]}
                  disabled={isPast}
                  onPress={() => handleSelectDay(day)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      s.dayText,
                      isSelected && s.dayTextSelected,
                      isToday && !isSelected && s.dayTextToday,
                      isPast && s.dayTextDisabled,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Action Buttons */}
          <View style={s.footer}>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn} activeOpacity={0.7}>
              <Text style={s.cancelBtnText}>{t("Cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: Math.min(width - 32, 340),
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: A.bdr2,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: A.orangeBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },
  weekdaysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekdayText: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
    borderRadius: 10,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    height: 38,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: A.orange,
  },
  dayCellToday: {
    backgroundColor: A.orangeBg,
    borderWidth: 1,
    borderColor: A.orange,
  },
  dayCellDisabled: {
    backgroundColor: "transparent",
  },
  dayText: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.text,
  },
  dayTextSelected: {
    color: "#ffffff",
    fontFamily: "Outfit-Bold",
  },
  dayTextToday: {
    color: A.orange,
    fontFamily: "Outfit-Bold",
  },
  dayTextDisabled: {
    color: A.textXs,
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 18,
    borderTopWidth: 1,
    borderColor: A.bdr,
    paddingTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: A.textS,
  },
});
