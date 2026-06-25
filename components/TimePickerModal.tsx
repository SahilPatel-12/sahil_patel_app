import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from "react-native";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");

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
};

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (timeString: string) => void;
  selectedValue: string;
}

const HOURS = ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];
const MINUTES = ["00", "15", "30", "45"];
const PERIODS = ["AM", "PM"];

export default function TimePickerModal({
  visible,
  onClose,
  onSelectTime,
  selectedValue,
}: TimePickerModalProps) {
  const { t } = useLanguage();

  const [selectedHour, setSelectedHour] = useState("6");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("PM");

  useEffect(() => {
    if (visible && selectedValue) {
      // Parse time string e.g., "6:00 PM"
      const match = selectedValue.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
      if (match) {
        setSelectedHour(match[1]);
        setSelectedMinute(match[2]);
        setSelectedPeriod(match[3].toUpperCase());
      }
    }
  }, [visible, selectedValue]);

  const handleConfirm = () => {
    const formattedTime = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    onSelectTime(formattedTime);
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
          <Text style={s.title}>{t("Select Preferred Time")}</Text>

          {/* Hour Selector Grid */}
          <Text style={s.sectionHeader}>{t("Hour")}</Text>
          <View style={s.grid}>
            {HOURS.map((hour) => {
              const isSelected = selectedHour === hour;
              return (
                <TouchableOpacity
                  key={hour}
                  style={[s.chip, isSelected && s.chipSelected]}
                  onPress={() => setSelectedHour(hour)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                    {hour}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Minute Selector */}
          <Text style={s.sectionHeader}>{t("Minute")}</Text>
          <View style={s.row}>
            {MINUTES.map((minute) => {
              const isSelected = selectedMinute === minute;
              return (
                <TouchableOpacity
                  key={minute}
                  style={[s.chip, { flex: 1 }, isSelected && s.chipSelected]}
                  onPress={() => setSelectedMinute(minute)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                    {minute}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Period Selector */}
          <Text style={s.sectionHeader}>{t("Slot")}</Text>
          <View style={s.row}>
            {PERIODS.map((period) => {
              const isSelected = selectedPeriod === period;
              return (
                <TouchableOpacity
                  key={period}
                  style={[s.chip, { flex: 1 }, isSelected && s.chipSelected]}
                  onPress={() => setSelectedPeriod(period)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                    {t(period === "AM" ? "Morning (AM)" : "Evening (PM)")}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Footer Buttons */}
          <View style={s.footer}>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn} activeOpacity={0.7}>
              <Text style={s.cancelBtnText}>{t("Cancel")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirm} style={s.confirmBtn} activeOpacity={0.7}>
              <Text style={s.confirmBtnText}>{t("Confirm")}</Text>
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
  title: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: A.text,
    textAlign: "center",
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: A.textS,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  row: {
    flexDirection: "row",
    gap: 6,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: A.bdr2,
    backgroundColor: A.bgSoft,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 46,
  },
  chipSelected: {
    backgroundColor: A.orange,
    borderColor: A.orange,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.textM,
  },
  chipTextSelected: {
    color: "#ffffff",
    fontFamily: "Outfit-Bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: A.bdr,
    paddingTop: 12,
    gap: 12,
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
  confirmBtn: {
    backgroundColor: A.orange,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: "#ffffff",
  },
});
