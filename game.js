// Copyright 2017 Ben North
//
// This file is part of "Exponential Mazezam Demo".
//
// "Exponential Mazezam Demo" is free software: you can redistribute it and/or
// modify it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or (at your
// option) any later version.
//
// "Exponential Mazezam Demo" is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General
// Public License for more details.
//
// You should have received a copy of the GNU General Public License along with
// "Exponential Mazezam Demo".  If not, see <http://www.gnu.org/licenses/>.

jQuery(document).ready(function($)
{
    var GRID_SZ = 10;
    var BIT_STRIDE = 11;
    var BIT_ENTRY_STRIDE = 2;
    var TOP_CORRIDOR_Y = 2;
    var BOTTOM_CORRIDOR_Y = 27;

    function printf2d(i)
    { return ((i > 9) ? '' : '0') + i; }

    function repeated(n, x)
    { var xs = []; for (var i = 0; i < n; ++i) xs.push(x); return xs; }

    function align_slices() {
        var dps = [5, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 4];
        var y = 0;
        for (var i = 0; i < 13; ++i) {
            $('#slice-' + printf2d(i)).css({position: 'absolute',
                                            top: (y * GRID_SZ) + 'px',
                                            left: '0px'});
            y += dps[i];
        }
    }

    function left_entry_for_bit(b)
    { return b * BIT_STRIDE + 3; }

    function extend_list(xs, new_xs)
    { xs.push.apply(xs, new_xs); }


    ////////////////////////////////////////////////////////////////////////////////////////

    function Counter() {
        this.id_suffices = ['11', '09', '07', '05', '03', '01'];
        this.reset();
    }

    Counter.prototype.reset = function() {
        this.bits = [0, 0, 0, 0, 0, 0];
        this.sync_display();
    }

    Counter.prototype.move_bit = function(b, x)
    { $('#slice-' + this.id_suffices[b]).css({left: (x * GRID_SZ) + 'px'}); }

    Counter.prototype.sync_display = function() {
        for (var i = 0; i < 6; ++i)
            this.move_bit(i, this.bits[i]);
        var rev_bits = this.bits.slice().reverse();
        $('#counter-value').html(rev_bits.join(' '));
    }


    ////////////////////////////////////////////////////////////////////////////////////////

    HorizontalTracker = function(player, b) {
        this.counter = player.counter;
        this.player = player;
        this.posn = b;
    }

    HorizontalTracker.prototype.slide = function(i) {
        var b = this.counter.bits[i];
        if (b != this.posn) {
            var dx = this.posn ? +1 : -1;
            var moves = this.player.rmove_fun(dx, 0, 2);
            this.posn = b;
            return moves;
        }
        return [];
    }


    ////////////////////////////////////////////////////////////////////////////////////////

    function Player(counter, ui) {
        this.counter = counter;
        this.ui = ui; this.reset();
    }

    Player.prototype.reset = function() {
        this.move(0, TOP_CORRIDOR_Y);
        this.n_moves = 0;
        this.sync_display();
    }

    Player.prototype.move = function(x, y) {
        var dx = Math.abs(this.x - x);
        var dy = Math.abs(this.y - y);
        this.x = x;
        this.y = y;
        this.n_moves += dx + dy;
        this.sync_display();
    }

    Player.prototype.sync_display = function() {
        $('#player').css({position: 'absolute',
                          top: (this.y * GRID_SZ) + 'px',
                          left: (this.x * GRID_SZ) + 'px'});
        $('#n-moves').html(this.n_moves);
    }

    Player.prototype.rmove_fun = function(dx, dy, reps) {
        var p = this;
        var f = function() { p.move(p.x + dx, p.y + dy); };
        if (reps === undefined)
            return f;
        else {
            if (this.ui.warp_speed) {
                if (reps > BIT_STRIDE) {
                    if (dy != 0) throw "big moves should be x only";
                    var small_bit = Math.floor(0.3 * reps) | 0;
                    var big_bit = reps - 2 * small_bit;
                    return [p.rmove_fun(dx * small_bit, 0),
                            p.rmove_fun(dx * big_bit, 0),
                            p.rmove_fun(dx * small_bit, 0)];
                } else {
                    return [p.rmove_fun(dx * reps, dy * reps)];
                }
            } else
                return repeated(reps, f);
        }
    }

    Player.prototype.new_HorizonalTracker = function(b)
    { return new HorizontalTracker(this, b); }

    Player.prototype.moves_to_bit_entry = function(b) {
        var target_entry_x = left_entry_for_bit(b);
        if (this.counter.bits[5] == 0)
            target_entry_x += 2;

        var dx = target_entry_x - this.x;
        return this.rmove_fun(Math.sign(dx), 0, Math.abs(dx));
    }

    Player.prototype.moves_up_column = function(b) {
        var ht = this.new_HorizonalTracker(this.counter.bits[0]);

        var moves = this.rmove_fun(0, -1, 2);
        for (var i = 1; i <= b; ++i) {
            extend_list(moves, this.rmove_fun(0, -1, 2));
            extend_list(moves, ht.slide(i));
            extend_list(moves, this.rmove_fun(0, -1, 2));
        }

        return moves;
    }

    Player.prototype.moves_from_bit_bottom = function()
    { return this.moves_up_column(5).concat(this.rmove_fun(0, -1, 3)); }

    Player.prototype.moves_to_bit_adjuster = function(b)
    { return this.moves_up_column(b); }

    Player.prototype.moves_down_column = function(b, start_inverted) {
        var b0 = this.counter.bits[b];
        if (start_inverted) b0 = 1 - b0;
        var ht = this.new_HorizonalTracker(b0);

        var moves = [];
        for (var i = (b - 1); i >= 0; --i) {
            extend_list(moves, this.rmove_fun(0, 1, 2));
            extend_list(moves, ht.slide(i));
            extend_list(moves, this.rmove_fun(0, 1, 2));
        }

        extend_list(moves, this.rmove_fun(0, 1, 2));

        return moves;
    }

    Player.prototype.moves_to_bit_bottom = function(b, stop_short) {
        var down_head = this.rmove_fun(0, 1, 3);
        var down_main = this.moves_down_column(5, false);
        var down_foot = this.rmove_fun(1, 0, (stop_short === undefined) ? 5 : 2);
        return down_head.concat(down_main).concat(down_foot)
    }

    Player.prototype.moves_from_bit_adjuster = function(b) {
        // Special case to avoid looping back sideways on ourselves:
        if (b == 0) {
            var down = this.rmove_fun(0, 1, 2);
            var across = this.rmove_fun(-1, 0, this.counter.bits[0] ? 7 : 3);
            return down.concat(across);
        }

        var down = this.moves_down_column(b, true);
        return down.concat(this.rmove_fun(-1, 0, 5));
    }

    Player.prototype.adjust_bit = function(b) {
        var p = this;
        var bval0 = p.counter.bits[b];
        var dx0 = bval0 ? -1 : +1;

        var move_and_adjust = function() {
            p.rmove_fun(dx0, 0)();
            p.counter.bits[b] = 1 - bval0;
            p.counter.sync_display();
        };

        var nops = repeated(this.ui.warp_speed ? 2 : 10, function(){});
        return (nops
                .concat([move_and_adjust])
                .concat(nops)
                .concat([this.rmove_fun(-dx0, 0)])
                .concat(nops));
    }


    ////////////////////////////////////////////////////////////////////////////////////////

    function Scheduler(ui) {
        this.ui = ui;
        this.counter = new Counter();
        this.player = new Player(this.counter, ui);
        this.reset();
    }

    Scheduler.prototype.reset = function() {
        this.pc = 0; this.subpc = 0;
        this.current_chunk = null;
        this.current_step_in_chunk = null;
        this.enabled = false;
        this.counter.reset();
        this.player.reset();
        this.completed = false;
    }

    Scheduler.prototype.next_chunk = function() {
        var solution = [0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4,
                        0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5,
                        0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4,
                        0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0];

        if (this.pc == solution.length)
            switch (this.subpc++) {
            case 0: return this.player.moves_to_bit_entry(6);
            case 1: return this.player.moves_to_bit_bottom(6, 'stop_short')
            case 2: this.completed = true; return null;
            }

        var b = solution[this.pc];

        switch (this.subpc++) {
        case 0: return this.player.moves_to_bit_entry(b);
        case 1: return this.player.moves_to_bit_bottom(b);
        case 2: return this.player.moves_to_bit_adjuster(b);
        case 3: return this.player.adjust_bit(b);
        case 4: return this.player.moves_from_bit_adjuster(b);
        case 5:
            this.subpc = 0;
            this.pc++;
            return this.player.moves_from_bit_bottom(b);
        }
    }

    Scheduler.prototype.step = function() {
        s = this;
        var step_fun = function() { s.step(); };

        window.requestAnimationFrame(step_fun);

        if (!this.enabled || this.completed || (++this.ui.wait_phase < this.ui.wait_period)) {
            return;
        }

        this.ui.wait_phase = 0;

        if (this.current_chunk === null) {
            this.current_chunk = this.next_chunk();
            this.current_step_in_chunk = 0;
        }

        if (this.current_chunk !== null) {
            this.current_chunk[this.current_step_in_chunk++]();
            if (this.current_step_in_chunk == this.current_chunk.length)
                this.current_chunk = null;
        }
    }


    ////////////////////////////////////////////////////////////////////////////////////////

    function UI() { this.reset(); }

    UI.prototype.reset = function() {
        this.warp_speed = false;
        this.wait_period = 3;
        this.wait_phase = 0;
    }

    UI.prototype.slow = function() { this.warp_speed = false; this.wait_period = 3; }
    UI.prototype.fast = function() { this.warp_speed = false; this.wait_period = 1; }
    UI.prototype.warp = function() { this.warp_speed = true; this.wait_period = 1; }
    UI.prototype.speed = function(val) { this[val](); }


    ////////////////////////////////////////////////////////////////////////////////////////

    var ui = new UI();
    var scheduler = new Scheduler(ui);

    align_slices();

    $('input[name=speed]').click(function() { ui.speed($(this).val()); });
    $('#btn-reset').click(function() { scheduler.reset(); $('#btn-start').attr('disabled', false); });
    $('#btn-start').click(function() { $(this).attr('disabled', true); scheduler.enabled = true; });

    window.requestAnimationFrame(function() { scheduler.step(); });
});
