export default interface Filter {
  active: boolean;
  isCompleted: boolean;
  $or?: any;
  endDay?: any;
  kind?: string;
  category?: string;
  $text?: any;
}