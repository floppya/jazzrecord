var fixtures = {
  tables: {
    people: [
      {name: "Nick", age: 28, home_id: 1, has_vehicle: true},
      {name: "Terri", home_id: 1, has_vehicle: true},
      {name: "David"},
      {name: "Karen"},
      {name: "Jesse", age: 24, income: 127.5, has_vehicle: true}
    ],
    homes: [
      {address: "4605 Deming Ave, Alexandria, VA 22212"}
    ],
    vehicles: [
      {make: "Suzuki", model: "Forenza", year: 2004, person_id: 1},
      {make: "Nissan", model: "Altima", year: 2005, person_id: 2}
    ],
    high_school_classes: [
      {name: "English"},
      {name: "Phys. Ed."}
    ],
    students: [
      {name: "Joe Bob", home_id: 1},
      {name: "Peggy Sue"}
    ]
  },
  
  mappingTables: {
    high_school_classes_students: [
      {high_school_class_id: 1, student_id: 1},
      {high_school_class_id: 1, student_id: 2},
      {high_school_class_id: 2, student_id: 1}
    ]
  }
};